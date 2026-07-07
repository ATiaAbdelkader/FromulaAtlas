/**
 * Irrigation Scheduler — data model, calendar generation, and export.
 *
 * Inspired by the Irrigation Unlimited Home Assistant integration
 * (https://github.com/rgc99/irrigation_unlimited) but rewritten in TypeScript
 * for browser use. No runtime dependencies on Home Assistant.
 *
 * Hierarchy:
 *   Controller (master valve + pump)
 *     └── Zone (single valve + drip line)
 *          └── Schedule (time + duration + filters)
 *     └── Sequence (ordered zone playlist)
 *          └── Schedule
 *          └── SequenceZone (zone_ref + delay + duration + repeat)
 *
 * Schedule filters:
 *   - weekday: [mon, tue, ...]
 *   - day: [1, 2, ...31] | 'odd' | 'even' | { every_n_days, start_n_days }
 *   - month: [jan, feb, ...]
 *   - from/until: seasonal window ('15 Mar' → '15 Sep')
 *   - time: absolute '07:30' | sun event { sun: 'sunrise'|'sunset', before, after } | cron
 *   - anchor: 'start' (default) or 'finish'
 *   - minimum/maximum/threshold duration clamps
 *
 * Export formats:
 *   - YAML (irrigation_unlimited-compatible — drops into HA config)
 *   - CSV calendar (one row per scheduled run, importable to Google Calendar)
 *   - JSON (re-importable to this app)
 *
 * All persistence is via localStorage. No network calls.
 */

// ============================================================================
// Types
// ============================================================================

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const ALL_WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type Month = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
export const ALL_MONTHS: Month[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Duration in seconds. Stored as number; formatted as 'HH:MM:SS' for display/YAML. */
export type Duration = number;

/** Time-of-day in minutes from midnight (0–1439). */
export type TimeOfDay = number;

export type DayFilter =
  | number[]                          // [1, 15, 31]
  | 'odd' | 'even'
  | { every_n_days: number; start_n_days: string };  // 'YYYY-MM-DD'

export type ScheduleTime =
  | { kind: 'absolute'; time: TimeOfDay }
  | { kind: 'sun'; sun: 'sunrise' | 'sunset'; before?: Duration; after?: Duration }
  | { kind: 'cron'; cron: string };

export interface Schedule {
  id: string;
  name: string;
  time: ScheduleTime;
  anchor: 'start' | 'finish';
  duration: Duration;
  weekday?: Weekday[];           // undefined = all days
  day?: DayFilter;               // undefined = all days
  month?: Month[];               // undefined = all months
  from?: string;                 // 'dd mmm' e.g. '15 Mar'
  until?: string;                // 'dd mmm'
  enabled: boolean;
}

export interface Zone {
  id: string;
  name: string;
  entityId?: string;             // switch entity (for YAML export)
  enabled: boolean;
  minimum: Duration;             // min run time (default 60s)
  maximum?: Duration;            // optional max
  duration: Duration;            // default run time
  /** Eco-mode: cycle N seconds on, M seconds off, repeat R times. */
  ecoMode?: { onSec: number; offSec: number; repeat: number };
  schedules: Schedule[];
}

export interface SequenceZone {
  zoneId: string;                // references Zone.id
  delay: Duration;               // delay before this zone starts
  duration?: Duration;           // overrides zone.duration
  repeat: number;
  enabled: boolean;
}

export interface Sequence {
  id: string;
  name: string;
  enabled: boolean;
  delay: Duration;               // default delay between zones
  duration?: Duration;           // total sequence duration (proportional adjust)
  repeat: number;
  schedules: Schedule[];         // when the sequence runs
  zones: SequenceZone[];         // ordered playlist
}

export interface Controller {
  id: string;
  name: string;
  enabled: boolean;
  entityId?: string;             // master valve / pump switch
  preamble: Duration;            // master on before zones
  postamble: Duration;           // master on after zones
  zones: Zone[];
  sequences: Sequence[];
}

export interface IrrigationSystem {
  controllers: Controller[];
}

// ============================================================================
// Calendar event generation
// ============================================================================

export interface CalendarEvent {
  /** ISO datetime 'YYYY-MM-DDTHH:MM:SS' */
  start: string;
  /** ISO datetime */
  end: string;
  durationSec: number;
  controllerId: string;
  controllerName: string;
  zoneId: string;
  zoneName: string;
  scheduleId?: string;
  scheduleName?: string;
  sequenceId?: string;
  sequenceName?: string;
  /** True if this is part of a cycle-and-soak eco-mode run. */
  isEcoCycle: boolean;
  /** Cycle index within an eco-mode run (0-based). */
  ecoCycleIndex?: number;
  /** Master valve on/off window for this event. */
  masterStart: string;
  masterEnd: string;
}

/**
 * Generate calendar events for a date range.
 *
 * @param system The irrigation system definition.
 * @param startDate Start date 'YYYY-MM-DD'.
 * @param days Number of days to generate (default 7).
 * @param sunTimes Optional sunrise/sunset times per date (for sun-event schedules).
 *                 Keyed by 'YYYY-MM-DD', value = { sunrise: 'HH:MM', sunset: 'HH:MM' }.
 * @param adjustment Optional percentage adjustment (e.g. 80 = run 80% of scheduled time).
 *                  Applied to all events, clamped by zone minimum/maximum.
 */
export function generateCalendar(
  system: IrrigationSystem,
  startDate: string,
  days = 7,
  sunTimes?: Record<string, { sunrise?: string; sunset?: string }>,
  adjustmentPct?: number,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const start = new Date(startDate + 'T00:00:00');

  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);

    for (const controller of system.controllers) {
      if (!controller.enabled) continue;

      for (const zone of controller.zones) {
        if (!zone.enabled) continue;

        for (const schedule of zone.schedules) {
          if (!schedule.enabled) continue;
          if (!matchesDateFilters(schedule, date)) continue;

          const startTime = resolveScheduleTime(schedule, dateStr, sunTimes);
          if (startTime === null) continue;

          let duration = applyAdjustment(schedule.duration, adjustmentPct, zone.minimum, zone.maximum);

          // Eco-mode: split into cycles
          if (zone.ecoMode && zone.ecoMode.repeat > 1) {
            const cycleDuration = Math.floor(duration / zone.ecoMode.repeat);
            for (let c = 0; c < zone.ecoMode.repeat; c++) {
              const cycleStart = addSecondsToDate(date, startTime + c * (cycleDuration + zone.ecoMode.offSec));
              const cycleEnd = addSecondsToDate(date, startTime + c * (cycleDuration + zone.ecoMode.offSec) + cycleDuration);
              events.push(makeEvent(controller, zone, schedule, cycleStart, cycleEnd, cycleDuration, true, c));
            }
          } else {
            const startSec = schedule.anchor === 'finish' ? startTime - duration : startTime;
            const evStart = addSecondsToDate(date, startSec);
            const evEnd = addSecondsToDate(date, startSec + duration);
            events.push(makeEvent(controller, zone, schedule, evStart, evEnd, duration, false));
          }
        }
      }

      // Sequences
      for (const seq of controller.sequences) {
        if (!seq.enabled) continue;

        for (const schedule of seq.schedules) {
          if (!schedule.enabled) continue;
          if (!matchesDateFilters(schedule, date)) continue;

          const startTime = resolveScheduleTime(schedule, dateStr, sunTimes);
          if (startTime === null) continue;

          // Compute per-zone durations
          const zoneDurations = computeSequenceDurations(seq, controller.zones);
          if (zoneDurations.size === 0) continue;

          let cursor = schedule.anchor === 'finish'
            ? startTime - sumSequenceDuration(seq, zoneDurations)
            : startTime;

          for (const sz of seq.zones) {
            if (!sz.enabled) continue;
            const zone = controller.zones.find(z => z.id === sz.zoneId);
            if (!zone || !zone.enabled) continue;

            cursor += sz.delay;
            const dur = zoneDurations.get(sz.zoneId) ?? sz.duration ?? zone.duration;
            const adjusted = applyAdjustment(dur, adjustmentPct, zone.minimum, zone.maximum);

            if (zone.ecoMode && zone.ecoMode.repeat > 1) {
              const cycleDuration = Math.floor(adjusted / zone.ecoMode.repeat);
              for (let c = 0; c < zone.ecoMode.repeat; c++) {
                const cs = cursor + c * (cycleDuration + zone.ecoMode.offSec);
                const ce = cs + cycleDuration;
                events.push(makeSequenceEvent(controller, zone, seq, schedule, addSecondsToDate(date, cs), addSecondsToDate(date, ce), cycleDuration, true, c));
              }
              cursor += adjusted + (zone.ecoMode.repeat - 1) * zone.ecoMode.offSec;
            } else {
              events.push(makeSequenceEvent(controller, zone, seq, schedule, addSecondsToDate(date, cursor), addSecondsToDate(date, cursor + adjusted), adjusted, false));
              cursor += adjusted;
            }
          }
        }
      }
    }
  }

  // Sort by start time
  events.sort((a, b) => a.start.localeCompare(b.start));
  return events;
}

// ============================================================================
// Filter matching
// ============================================================================

const MONTH_TO_NUM: Record<Month, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const WEEKDAY_TO_NUM: Record<Weekday, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function matchesDateFilters(schedule: Schedule, date: Date): boolean {
  // Weekday filter
  if (schedule.weekday && schedule.weekday.length > 0) {
    const dayNum = date.getDay();  // 0=Sun
    const allowed = schedule.weekday.map(w => WEEKDAY_TO_NUM[w]);
    if (!allowed.includes(dayNum)) return false;
  }

  // Month filter
  if (schedule.month && schedule.month.length > 0) {
    const monthNum = date.getMonth();
    const allowed = schedule.month.map(m => MONTH_TO_NUM[m]);
    if (!allowed.includes(monthNum)) return false;
  }

  // Day-of-month filter
  if (schedule.day) {
    const dom = date.getDate();
    if (Array.isArray(schedule.day)) {
      if (!schedule.day.includes(dom)) return false;
    } else if (schedule.day === 'odd') {
      if (dom % 2 === 0) return false;
    } else if (schedule.day === 'even') {
      if (dom % 2 !== 0) return false;
    } else if (typeof schedule.day === 'object') {
      // every_n_days
      const start = new Date(schedule.day.start_n_days + 'T00:00:00');
      const diff = Math.floor((date.getTime() - start.getTime()) / 86400000);
      if (diff < 0 || diff % schedule.day.every_n_days !== 0) return false;
    }
  }

  // Seasonal window
  if (schedule.from && schedule.until) {
    const year = date.getFullYear();
    const fromParts = schedule.from.match(/(\d+)\s+(\w+)/);
    const untilParts = schedule.until.match(/(\d+)\s+(\w+)/);
    if (fromParts && untilParts) {
      const fromMonth = MONTH_TO_NUM[fromParts[2].toLowerCase() as Month];
      const untilMonth = MONTH_TO_NUM[untilParts[2].toLowerCase() as Month];
      const fromDate = new Date(year, fromMonth, parseInt(fromParts[1]));
      const untilDate = new Date(year, untilMonth, parseInt(untilParts[1]));
      if (fromDate <= untilDate) {
        if (date < fromDate || date > untilDate) return false;
      } else {
        // Wraps around year (e.g. Nov → Mar)
        if (date < fromDate && date > untilDate) return false;
      }
    }
  }

  return true;
}

// ============================================================================
// Time resolution
// ============================================================================

function resolveScheduleTime(
  schedule: Schedule,
  dateStr: string,
  sunTimes?: Record<string, { sunrise?: string; sunset?: string }>,
): number | null {
  // Returns seconds from midnight
  switch (schedule.time.kind) {
    case 'absolute':
      return schedule.time.time * 60;

    case 'sun': {
      const sun = sunTimes?.[dateStr];
      if (!sun) return null;
      const ref = schedule.time.sun === 'sunrise' ? sun.sunrise : sun.sunset;
      if (!ref) return null;
      const [h, m] = ref.split(':').map(Number);
      let sec = (h * 3600 + m * 60);
      if (schedule.time.before) sec -= schedule.time.before;
      if (schedule.time.after) sec += schedule.time.after;
      return sec;
    }

    case 'cron':
      // Simplified cron: only support 'M H * * *' (minute hour day month weekday)
      // For full cron, would need a proper parser. This handles the common case.
      return parseCronTime(schedule.time.cron, dateStr);

    default:
      return null;
  }
}

function parseCronTime(cron: string, dateStr: string): number | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return null;
  const [minPart, hourPart] = parts;

  // Check if this date matches the cron's day/month/weekday
  // (simplified: only check minute + hour for now; day filters are handled by Schedule filters)

  // Parse minutes: number, '*', or range/list
  const minutes = parseCronField(minPart, 0, 59);
  const hours = parseCronField(hourPart, 0, 23);

  if (minutes.length === 0 || hours.length === 0) return null;

  // Return the first matching time (earliest in the day)
  for (const h of hours) {
    for (const m of minutes) {
      return h * 3600 + m * 60;
    }
  }
  return null;
}

function parseCronField(field: string, min: number, max: number): number[] {
  if (field === '*') {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }
  // Handle ranges like '5-17'
  if (field.includes('-')) {
    const [a, b] = field.split('-').map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  // Handle lists like '0,15,30,45'
  if (field.includes(',')) {
    return field.split(',').map(Number).filter(n => n >= min && n <= max);
  }
  // Single number
  const n = parseInt(field);
  return n >= min && n <= max ? [n] : [];
}

// ============================================================================
// Sequence duration computation
// ============================================================================

function computeSequenceDurations(
  seq: Sequence,
  zones: Zone[],
): Map<string, number> {
  const result = new Map<string, number>();

  // Sum the "natural" durations (sequence-zone override or zone default)
  let totalNatural = 0;
  for (const sz of seq.zones) {
    if (!sz.enabled) continue;
    const zone = zones.find(z => z.id === sz.zoneId);
    if (!zone) continue;
    const dur = sz.duration ?? zone.duration;
    result.set(sz.zoneId, dur);
    totalNatural += dur;
  }

  // If sequence has a total duration specified, scale proportionally
  if (seq.duration && totalNatural > 0) {
    const scale = seq.duration / totalNatural;
    for (const [key, val] of result) {
      result.set(key, Math.round(val * scale));
    }
  }

  return result;
}

function sumSequenceDuration(seq: Sequence, durations: Map<string, number>): number {
  let total = 0;
  for (const sz of seq.zones) {
    if (!sz.enabled) continue;
    total += durations.get(sz.zoneId) ?? 0;
    total += sz.delay;
  }
  return total;
}

// ============================================================================
// Adjustment + helpers
// ============================================================================

function applyAdjustment(
  duration: Duration,
  pct: number | undefined,
  minimum: Duration,
  maximum: Duration | undefined,
): Duration {
  if (pct === undefined) return Math.max(minimum, duration);
  const adjusted = Math.round(duration * pct / 100);
  const clamped = Math.max(minimum, adjusted);
  return maximum !== undefined ? Math.min(maximum, clamped) : clamped;
}

function addSecondsToDate(date: Date, secondsFromMidnight: number): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setSeconds(d.getSeconds() + secondsFromMidnight);
  return d.toISOString().slice(0, 19);
}

function makeEvent(
  controller: Controller,
  zone: Zone,
  schedule: Schedule,
  start: string,
  end: string,
  duration: number,
  isEco: boolean,
  ecoIdx?: number,
): CalendarEvent {
  const masterStart = addSecondsToISO(start, -controller.preamble);
  const masterEnd = addSecondsToISO(end, controller.postamble);
  return {
    start, end, durationSec: duration,
    controllerId: controller.id, controllerName: controller.name,
    zoneId: zone.id, zoneName: zone.name,
    scheduleId: schedule.id, scheduleName: schedule.name,
    isEcoCycle: isEco, ecoCycleIndex: ecoIdx,
    masterStart, masterEnd,
  };
}

function makeSequenceEvent(
  controller: Controller,
  zone: Zone,
  seq: Sequence,
  schedule: Schedule,
  start: string,
  end: string,
  duration: number,
  isEco: boolean,
  ecoIdx?: number,
): CalendarEvent {
  const masterStart = addSecondsToISO(start, -controller.preamble);
  const masterEnd = addSecondsToISO(end, controller.postamble);
  return {
    start, end, durationSec: duration,
    controllerId: controller.id, controllerName: controller.name,
    zoneId: zone.id, zoneName: zone.name,
    scheduleId: schedule.id, scheduleName: schedule.name,
    sequenceId: seq.id, sequenceName: seq.name,
    isEcoCycle: isEco, ecoCycleIndex: ecoIdx,
    masterStart, masterEnd,
  };
}

function addSecondsToISO(iso: string, seconds: number): string {
  const d = new Date(iso);
  d.setSeconds(d.getSeconds() + seconds);
  return d.toISOString().slice(0, 19);
}

// ============================================================================
// Duration formatting
// ============================================================================

/** Format seconds as 'HH:MM:SS' (irrigation_unlimited convention). */
export function formatDuration(sec: Duration): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Parse 'HH:MM:SS' or 'HH:MM' or seconds → Duration. */
export function parseDuration(input: string): Duration {
  const parts = input.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
  const n = parseInt(input);
  return Number.isFinite(n) ? n : 0;
}

/** Format TimeOfDay (minutes from midnight) as 'HH:MM'. */
export function formatTimeOfDay(min: TimeOfDay): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ============================================================================
// YAML export (irrigation_unlimited-compatible)
// ============================================================================

export function toYAML(system: IrrigationSystem): string {
  const lines: string[] = [
    '# Irrigation Unlimited configuration',
    '# Generated by Formula Atlas — Irrigation Scheduler',
    `# ${new Date().toISOString()}`,
    '',
    'irrigation_unlimited:',
  ];

  if (system.controllers.length === 0) {
    lines.push('  controllers: []');
    return lines.join('\n');
  }

  lines.push('  controllers:');
  for (const c of system.controllers) {
    lines.push(`    - name: ${yamlStr(c.name)}`);
    if (c.entityId) lines.push(`      entity_id: ${yamlStr(c.entityId)}`);
    lines.push(`      enabled: ${c.enabled}`);
    if (c.preamble > 0) lines.push(`      preamble: ${yamlStr(formatDuration(c.preamble))}`);
    if (c.postamble > 0) lines.push(`      postamble: ${yamlStr(formatDuration(c.postamble))}`);

    if (c.zones.length > 0) {
      lines.push('      zones:');
      for (const z of c.zones) {
        lines.push(`        - zone_id: ${yamlStr(z.id)}`);
        lines.push(`          name: ${yamlStr(z.name)}`);
        if (z.entityId) lines.push(`          entity_id: ${yamlStr(z.entityId)}`);
        lines.push(`          enabled: ${z.enabled}`);
        lines.push(`          minimum: ${yamlStr(formatDuration(z.minimum))}`);
        if (z.maximum) lines.push(`          maximum: ${yamlStr(formatDuration(z.maximum))}`);
        lines.push(`          duration: ${yamlStr(formatDuration(z.duration))}`);

        if (z.schedules.length > 0) {
          lines.push('          schedules:');
          for (const s of z.schedules) {
            lines.push(`            - schedule_id: ${yamlStr(s.id)}`);
            lines.push(`              name: ${yamlStr(s.name)}`);
            lines.push(yamlTime(s.time));
            lines.push(`              anchor: ${s.anchor}`);
            lines.push(`              duration: ${yamlStr(formatDuration(s.duration))}`);
            if (s.weekday) lines.push(`              weekday: [${s.weekday.join(', ')}]`);
            if (s.month) lines.push(`              month: [${s.month.join(', ')}]`);
            if (s.day) {
              if (Array.isArray(s.day)) lines.push(`              day: [${s.day.join(', ')}]`);
              else if (typeof s.day === 'string') lines.push(`              day: ${s.day}`);
              else lines.push(`              day: { every_n_days: ${s.day.every_n_days}, start_n_days: ${yamlStr(s.day.start_n_days)} }`);
            }
            if (s.from && s.until) {
              lines.push(`              from: ${yamlStr(s.from)}`);
              lines.push(`              until: ${yamlStr(s.until)}`);
            }
            lines.push(`              enabled: ${s.enabled}`);
          }
        }
      }
    }

    if (c.sequences.length > 0) {
      lines.push('      sequences:');
      for (const seq of c.sequences) {
        lines.push(`        - sequence_id: ${yamlStr(seq.id)}`);
        lines.push(`          name: ${yamlStr(seq.name)}`);
        lines.push(`          enabled: ${seq.enabled}`);
        if (seq.delay > 0) lines.push(`          delay: ${yamlStr(formatDuration(seq.delay))}`);
        if (seq.duration) lines.push(`          duration: ${yamlStr(formatDuration(seq.duration))}`);
        if (seq.repeat > 1) lines.push(`          repeat: ${seq.repeat}`);

        if (seq.schedules.length > 0) {
          lines.push('          schedules:');
          for (const s of seq.schedules) {
            lines.push(`            - schedule_id: ${yamlStr(s.id)}`);
            lines.push(`              name: ${yamlStr(s.name)}`);
            lines.push(yamlTime(s.time));
            lines.push(`              anchor: ${s.anchor}`);
            lines.push(`              duration: ${yamlStr(formatDuration(s.duration))}`);
            if (s.weekday) lines.push(`              weekday: [${s.weekday.join(', ')}]`);
            if (s.month) lines.push(`              month: [${s.month.join(', ')}]`);
            lines.push(`              enabled: ${s.enabled}`);
          }
        }

        if (seq.zones.length > 0) {
          lines.push('          zones:');
          for (const sz of seq.zones) {
            lines.push(`            - zone_id: ${yamlStr(sz.zoneId)}`);
            if (sz.delay > 0) lines.push(`              delay: ${yamlStr(formatDuration(sz.delay))}`);
            if (sz.duration) lines.push(`              duration: ${yamlStr(formatDuration(sz.duration))}`);
            if (sz.repeat > 1) lines.push(`              repeat: ${sz.repeat}`);
            lines.push(`              enabled: ${sz.enabled}`);
          }
        }
      }
    }
  }

  return lines.join('\n');
}

function yamlStr(s: string | number | boolean): string {
  if (typeof s === 'string') {
    // Quote if contains special chars
    if (/[:\[\]\{\},&\*#\?\|<>=!%@`"']/.test(s) || s.includes(' ')) {
      return `"${s.replace(/"/g, '\\"')}"`;
    }
    return s;
  }
  return String(s);
}

function yamlTime(t: ScheduleTime): string {
  if (t.kind === 'absolute') {
    return `              time: ${yamlStr(formatTimeOfDay(t.time))}`;
  }
  if (t.kind === 'cron') {
    return `              time:\n                cron: ${yamlStr(t.cron)}`;
  }
  // sun
  const parts = [`                sun: ${t.sun}`];
  if (t.before) parts.push(`                before: ${yamlStr(formatDuration(t.before))}`);
  if (t.after) parts.push(`                after: ${yamlStr(formatDuration(t.after))}`);
  return `              time:\n${parts.join('\n')}`;
}

// ============================================================================
// CSV calendar export
// ============================================================================

export function toCSV(events: CalendarEvent[]): string {
  const rows = [
    'Subject,Start Date,Start Time,End Date,End Time,Duration (min),Controller,Zone,Schedule,Sequence,Eco Cycle',
  ];
  for (const e of events) {
    const startDate = e.start.slice(0, 10);
    const startTime = e.start.slice(11, 19);
    const endDate = e.end.slice(0, 10);
    const endTime = e.end.slice(11, 19);
    const durMin = (e.durationSec / 60).toFixed(1);
    const subject = e.sequenceName
      ? `${e.sequenceName} → ${e.zoneName}`
      : `${e.zoneName} — ${e.scheduleName ?? 'Schedule'}`;
    const eco = e.isEcoCycle ? `Cycle ${(e.ecoCycleIndex ?? 0) + 1}` : '';
    rows.push([
      csvEscape(subject),
      startDate, startTime,
      endDate, endTime,
      durMin,
      csvEscape(e.controllerName),
      csvEscape(e.zoneName),
      csvEscape(e.scheduleName ?? ''),
      csvEscape(e.sequenceName ?? ''),
      eco,
    ].join(','));
  }
  return rows.join('\n');
}

function csvEscape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ============================================================================
// JSON export (for re-import)
// ============================================================================

export function toJSON(system: IrrigationSystem): string {
  return JSON.stringify(system, null, 2);
}

export function fromJSON(json: string): IrrigationSystem {
  return JSON.parse(json);
}

// ============================================================================
// Default system + ID generation
// ============================================================================

let idCounter = 0;
export function genId(prefix: string): string {
  idCounter++;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function createDefaultSystem(): IrrigationSystem {
  return {
    controllers: [
      {
        id: genId('c'),
        name: 'Main Controller',
        enabled: true,
        preamble: 120,    // 2 min pump prime
        postamble: 60,    // 1 min drain
        zones: [
          {
            id: genId('z'),
            name: 'Front Lawn',
            enabled: true,
            minimum: 60,
            duration: 1200,  // 20 min
            schedules: [
              {
                id: genId('s'),
                name: 'Morning',
                time: { kind: 'absolute', time: 6 * 60 },  // 06:00
                anchor: 'start',
                duration: 1200,
                enabled: true,
              },
            ],
          },
          {
            id: genId('z'),
            name: 'Vegetable Garden',
            enabled: true,
            minimum: 60,
            duration: 900,   // 15 min
            schedules: [
              {
                id: genId('s'),
                name: 'Evening',
                time: { kind: 'absolute', time: 18 * 60 },
                anchor: 'start',
                duration: 900,
                enabled: true,
              },
            ],
          },
        ],
        sequences: [],
      },
    ],
  };
}
