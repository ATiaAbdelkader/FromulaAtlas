'use client';

/**
 * Irrigation Scheduler — design controllers, zones, schedules, and sequences,
 * then generate a 7-day calendar and export to YAML / CSV / JSON.
 *
 * Inspired by the Irrigation Unlimited Home Assistant integration. The YAML
 * export is compatible with their config format — drop it into HA and it
 * just works.
 *
 * Three tabs:
 *   1. Zones & Controllers — define hardware (controllers, zones, eco-mode)
 *   2. Schedules & Sequences — when each zone/sequence runs
 *   3. Calendar & Export — 7-day visual + YAML/CSV/JSON export
 *
 * All data persists to localStorage.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock, Plus, Trash2, Download, Copy, Check, Calendar as CalendarIcon,
  Settings, Layers, Zap, Sun, Cloud, RefreshCw, AlertTriangle,
  CheckCircle2, Play, Pause, ChevronRight, FileJson, FileCode, FileSpreadsheet,
} from 'lucide-react';
import {
  type IrrigationSystem, type Controller, type Zone, type Schedule, type Sequence, type SequenceZone,
  type Weekday, type Month, type ScheduleTime, type DayFilter,
  type Duration, type CalendarEvent,
  ALL_WEEKDAYS, ALL_MONTHS,
  generateCalendar, formatDuration, parseDuration, formatTimeOfDay,
  toYAML, toCSV, toJSON, fromJSON, createDefaultSystem, genId,
} from '@/lib/irrigation-scheduler';

const STORAGE_KEY = 'irrigation_scheduler_v1';

type Tab = 'zones' | 'schedules' | 'calendar';

export function IrrigationScheduler() {
  const [tab, setTab] = useState<Tab>('zones');
  const [system, setSystem] = useState<IrrigationSystem | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSystem(fromJSON(saved));
      } else {
        setSystem(createDefaultSystem());
      }
    } catch {
      setSystem(createDefaultSystem());
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (system) {
      localStorage.setItem(STORAGE_KEY, toJSON(system));
    }
  }, [system]);

  const updateController = useCallback((id: string, patch: Partial<Controller>) => {
    setSystem(s => s ? {
      ...s,
      controllers: s.controllers.map(c => c.id === id ? { ...c, ...patch } : c),
    } : s);
  }, []);

  const addZone = useCallback((controllerId: string) => {
    setSystem(s => s ? {
      ...s,
      controllers: s.controllers.map(c => c.id === controllerId ? {
        ...c,
        zones: [...c.zones, {
          id: genId('z'),
          name: `Zone ${c.zones.length + 1}`,
          enabled: true,
          minimum: 60,
          duration: 900,
          schedules: [],
        }],
      } : c),
    } : s);
  }, []);

  const updateZone = useCallback((controllerId: string, zoneId: string, patch: Partial<Zone>) => {
    setSystem(s => s ? {
      ...s,
      controllers: s.controllers.map(c => c.id === controllerId ? {
        ...c,
        zones: c.zones.map(z => z.id === zoneId ? { ...z, ...patch } : z),
      } : c),
    } : s);
  }, []);

  const deleteZone = useCallback((controllerId: string, zoneId: string) => {
    setSystem(s => s ? {
      ...s,
      controllers: s.controllers.map(c => c.id === controllerId ? {
        ...c,
        zones: c.zones.filter(z => z.id !== zoneId),
      } : c),
    } : s);
  }, []);

  const addSchedule = useCallback((controllerId: string, zoneId: string) => {
    const newSched: Schedule = {
      id: genId('s'),
      name: 'New Schedule',
      time: { kind: 'absolute', time: 6 * 60 },
      anchor: 'start',
      duration: 600,
      enabled: true,
    };
    setSystem(s => s ? {
      ...s,
      controllers: s.controllers.map(c => c.id === controllerId ? {
        ...c,
        zones: c.zones.map(z => z.id === zoneId ? {
          ...z,
          schedules: [...z.schedules, newSched],
        } : z),
      } : c),
    } : s);
  }, []);

  const updateSchedule = useCallback((controllerId: string, zoneId: string, schedId: string, patch: Partial<Schedule>) => {
    setSystem(s => s ? {
      ...s,
      controllers: s.controllers.map(c => c.id === controllerId ? {
        ...c,
        zones: c.zones.map(z => z.id === zoneId ? {
          ...z,
          schedules: z.schedules.map(sc => sc.id === schedId ? { ...sc, ...patch } : sc),
        } : z),
      } : c),
    } : s);
  }, []);

  const deleteSchedule = useCallback((controllerId: string, zoneId: string, schedId: string) => {
    setSystem(s => s ? {
      ...s,
      controllers: s.controllers.map(c => c.id === controllerId ? {
        ...c,
        zones: c.zones.map(z => z.id === zoneId ? {
          ...z,
          schedules: z.schedules.filter(sc => sc.id !== schedId),
        } : z),
      } : c),
    } : s);
  }, []);

  if (!system) {
    return <div className="text-xs text-muted-foreground p-4">Loading…</div>;
  }

  return (
    <Card className="overflow-hidden border-cyan-100 shadow-sm dark:border-cyan-900/60">
      <CardHeader className="border-b border-border/60 bg-cyan-50/40 pb-4 dark:bg-cyan-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"><Clock className="h-4 w-4" /></span> Irrigation Scheduler</CardTitle>
        <p className="text-[10px] text-muted-foreground">Controllers · Zones · Schedules · Sequences · Cycle-and-soak · YAML/CSV/JSON export</p>
        <div className="mt-3 grid grid-cols-1 gap-1 rounded-xl border border-border/70 bg-background/70 p-1 sm:grid-cols-3">
          <TabBtn active={tab === 'zones'} onClick={() => setTab('zones')} icon={Settings} label="Zones" />
          <TabBtn active={tab === 'schedules'} onClick={() => setTab('schedules')} icon={CalendarIcon} label="Schedules" />
          <TabBtn active={tab === 'calendar'} onClick={() => setTab('calendar')} icon={Layers} label="Calendar & Export" />
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'zones' && (
          <ZonesTab
            system={system}
            onUpdateController={updateController}
            onAddZone={addZone}
            onUpdateZone={updateZone}
            onDeleteZone={deleteZone}
          />
        )}
        {tab === 'schedules' && (
          <SchedulesTab
            system={system}
            onAddSchedule={addSchedule}
            onUpdateSchedule={updateSchedule}
            onDeleteSchedule={deleteSchedule}
          />
        )}
        {tab === 'calendar' && (
          <CalendarTab system={system} />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tab 1 — Zones & Controllers
// ============================================================================

function ZonesTab({ system, onUpdateController, onAddZone, onUpdateZone, onDeleteZone }: {
  system: IrrigationSystem;
  onUpdateController: (id: string, patch: Partial<Controller>) => void;
  onAddZone: (controllerId: string) => void;
  onUpdateZone: (controllerId: string, zoneId: string, patch: Partial<Zone>) => void;
  onDeleteZone: (controllerId: string, zoneId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {system.controllers.map(c => (
        <div key={c.id} className="space-y-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
          {/* Controller header */}
          <div className="flex items-center gap-2 flex-wrap">
            <Settings className="h-4 w-4 text-cyan-600" />
            <Input aria-label="Controller name"
              value={c.name}
              onChange={e => onUpdateController(c.id, { name: e.target.value })}
              className="h-10 min-w-[140px] flex-1 text-sm font-semibold"
            />
            <Badge variant={c.enabled ? 'default' : 'outline'} className="text-[9px]">{c.enabled ? 'ON' : 'OFF'}</Badge>
          </div>

          {/* Controller settings */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium">Preamble (pump prime)</Label>
              <Input
                value={formatDuration(c.preamble)}
                onChange={e => onUpdateController(c.id, { preamble: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Postamble (drain)</Label>
              <Input
                value={formatDuration(c.postamble)}
                onChange={e => onUpdateController(c.id, { postamble: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Master valve entity</Label>
              <Input
                value={c.entityId ?? ''}
                onChange={e => onUpdateController(c.id, { entityId: e.target.value })}
                placeholder="switch.pump"
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
          </div>

          {/* Zones */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3 w-3" /> Zones ({c.zones.length})
            </div>
            {c.zones.map(z => (
              <ZoneRow
                key={z.id}
                zone={z}
                onUpdate={(patch) => onUpdateZone(c.id, z.id, patch)}
                onDelete={() => onDeleteZone(c.id, z.id)}
              />
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={() => onAddZone(c.id)} className="h-10 w-full gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Zone
          </Button>
        </div>
      ))}

      <div className="rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        💡 <strong>Preamble</strong> = master valve opens before any zone (pump prime). <strong>Postamble</strong> = master stays on after zones close (prevents water hammer). <strong>Eco-mode</strong> = cycle-and-soak for clay soils to prevent runoff.
      </div>
    </div>
  );
}

function ZoneRow({ zone, onUpdate, onDelete }: {
  zone: Zone;
  onUpdate: (patch: Partial<Zone>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="flex items-center gap-2 p-2.5">
        <button
          aria-label={expanded ? `Collapse ${zone.name}` : `Expand ${zone.name}`}
          onClick={() => setExpanded(e => !e)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <Input
          aria-label="Zone name"
          value={zone.name}
          onChange={e => onUpdate({ name: e.target.value })}
          className="h-10 min-w-0 flex-1 text-sm"
        />
        <Badge variant={zone.enabled ? 'default' : 'outline'} className="text-[9px]">{zone.enabled ? 'ON' : 'OFF'}</Badge>
        <button
          aria-label={zone.enabled ? `Pause ${zone.name}` : `Enable ${zone.name}`}
          onClick={() => onUpdate({ enabled: !zone.enabled })}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {zone.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button aria-label={`Delete ${zone.name}`} onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {expanded && (
        <div className="space-y-3 border-t bg-muted/10 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium">Min run time</Label>
              <Input
                value={formatDuration(zone.minimum)}
                onChange={e => onUpdate({ minimum: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Default duration</Label>
              <Input
                value={formatDuration(zone.duration)}
                onChange={e => onUpdate({ duration: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Max run time (opt)</Label>
              <Input
                value={zone.maximum ? formatDuration(zone.maximum) : ''}
                onChange={e => onUpdate({ maximum: e.target.value ? parseDuration(e.target.value) : undefined })}
                placeholder="—"
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
          </div>

          {/* Eco-mode */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="h-3 w-3 text-amber-600" />
              <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">Eco-Mode (Cycle & Soak)</span>
              <Badge variant={zone.ecoMode ? 'default' : 'outline'} className="text-[9px] ml-auto">{zone.ecoMode ? 'ON' : 'OFF'}</Badge>
            </div>
            {zone.ecoMode ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[9px]">On (sec)</Label>
                  <Input
                    type="number" min={10}
                    value={zone.ecoMode.onSec}
                    onChange={e => onUpdate({ ecoMode: { ...zone.ecoMode!, onSec: Math.max(10, parseInt(e.target.value) || 300) } })}
                    className="mt-1 h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[9px]">Off (sec)</Label>
                  <Input
                    type="number" min={0}
                    value={zone.ecoMode.offSec}
                    onChange={e => onUpdate({ ecoMode: { ...zone.ecoMode!, offSec: Math.max(0, parseInt(e.target.value) || 60) } })}
                    className="mt-1 h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[9px]">Repeat</Label>
                  <Input
                    type="number" min={2}
                    value={zone.ecoMode.repeat}
                    onChange={e => onUpdate({ ecoMode: { ...zone.ecoMode!, repeat: Math.max(2, parseInt(e.target.value) || 3) } })}
                    className="mt-1 h-10 text-sm font-mono"
                  />
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onUpdate({ ecoMode: { onSec: 300, offSec: 120, repeat: 3 } })} className="h-9 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Enable cycle-and-soak
              </Button>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium">Valve entity (for YAML export)</Label>
            <Input
              value={zone.entityId ?? ''}
              onChange={e => onUpdate({ entityId: e.target.value })}
              placeholder="switch.zone_1_valve"
              className="mt-1 h-10 text-sm font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tab 2 — Schedules & Sequences
// ============================================================================

function SchedulesTab({ system, onAddSchedule, onUpdateSchedule, onDeleteSchedule }: {
  system: IrrigationSystem;
  onAddSchedule: (controllerId: string, zoneId: string) => void;
  onUpdateSchedule: (controllerId: string, zoneId: string, schedId: string, patch: Partial<Schedule>) => void;
  onDeleteSchedule: (controllerId: string, zoneId: string, schedId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {system.controllers.map(c => (
        <div key={c.id} className="space-y-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Settings className="h-3.5 w-3.5 text-cyan-600" /> {c.name}
          </div>
          {c.zones.map(z => (
            <div key={z.id} className="space-y-3 rounded-xl border bg-background p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium flex-1">{z.name}</span>
                <Badge variant="outline" className="text-[9px]">{z.schedules.length} schedule{z.schedules.length !== 1 ? 's' : ''}</Badge>
              </div>
              {/* Existing schedules */}
              {z.schedules.map(s => (
                <ScheduleRow
                  key={s.id}
                  schedule={s}
                  onUpdate={(patch) => onUpdateSchedule(c.id, z.id, s.id, patch)}
                  onDelete={() => onDeleteSchedule(c.id, z.id, s.id)}
                />
              ))}
              <Button size="sm" variant="outline" onClick={() => onAddSchedule(c.id, z.id)} className="h-10 w-full gap-1.5 text-xs">
                <Plus className="h-3 w-3" /> Add Schedule
              </Button>
            </div>
          ))}
        </div>
      ))}
      <div className="rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        💡 <strong>Anchor = start</strong> = run begins at the time. <strong>Anchor = finish</strong> = run ends at the time. Sun events use Open-Meteo sunrise/sunset from the ET Tracker's location (configure on the Calendar tab).
      </div>
    </div>
  );
}

function ScheduleRow({ schedule, onUpdate, onDelete }: {
  schedule: Schedule;
  onUpdate: (patch: Partial<Schedule>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border bg-muted/10 shadow-sm">
      <div className="flex items-center gap-1.5 p-2.5">
        <button aria-label={expanded ? `Collapse ${schedule.name}` : `Expand ${schedule.name}`} onClick={() => setExpanded(e => !e)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <Input
          aria-label="Schedule name"
          value={schedule.name}
          onChange={e => onUpdate({ name: e.target.value })}
          className="h-10 min-w-0 flex-1 text-sm"
        />
        <Badge variant="outline" className="text-[9px] font-mono">
          {schedule.time.kind === 'absolute' && formatTimeOfDay(schedule.time.time)}
          {schedule.time.kind === 'sun' && `${schedule.time.sun}`}
          {schedule.time.kind === 'cron' && 'cron'}
        </Badge>
        <Badge variant="outline" className="text-[9px] font-mono">{formatDuration(schedule.duration)}</Badge>
        <button aria-label={schedule.enabled ? `Pause ${schedule.name}` : `Enable ${schedule.name}`} onClick={() => onUpdate({ enabled: !schedule.enabled })} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          {schedule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button aria-label={`Delete ${schedule.name}`} onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {expanded && (
        <div className="space-y-3 border-t bg-background p-3">
          {/* Time type */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(['absolute', 'sun', 'cron'] as const).map(k => (
              <button
                key={k}
                onClick={() => {
                  if (k === 'absolute') onUpdate({ time: { kind: 'absolute', time: 360 } });
                  else if (k === 'sun') onUpdate({ time: { kind: 'sun', sun: 'sunrise' } });
                  else onUpdate({ time: { kind: 'cron', cron: '0 6 * * *' } });
                }}
                className={`h-10 rounded-lg border text-xs ${schedule.time.kind === k ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-border bg-background'}`}
              >
                {k === 'absolute' ? 'Time' : k === 'sun' ? 'Sun' : 'Cron'}
              </button>
            ))}
          </div>

          {schedule.time.kind === 'absolute' && (
            <div>
              <Label className="text-[9px]">Time (HH:MM)</Label>
              <Input
                type="time"
                value={formatTimeOfDay(schedule.time.time)}
                onChange={e => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  onUpdate({ time: { kind: 'absolute', time: h * 60 + m } });
                }}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
          )}
          {schedule.time.kind === 'sun' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[9px]">Event</Label>
                <select
                  value={schedule.time.sun}
                  onChange={e => {
                    if (schedule.time.kind === 'sun') {
                      onUpdate({ time: { ...schedule.time, sun: e.target.value as 'sunrise' | 'sunset' } });
                    }
                  }}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="sunrise">Sunrise</option>
                  <option value="sunset">Sunset</option>
                </select>
              </div>
              <div>
                <Label className="text-[9px]">Before (sec)</Label>
                <Input
                  type="number"
                  value={schedule.time.before ?? 0}
                  onChange={e => {
                    if (schedule.time.kind === 'sun') {
                      onUpdate({ time: { ...schedule.time, before: parseInt(e.target.value) || 0 } });
                    }
                  }}
                  className="mt-1 h-10 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-[9px]">After (sec)</Label>
                <Input
                  type="number"
                  value={schedule.time.after ?? 0}
                  onChange={e => {
                    if (schedule.time.kind === 'sun') {
                      onUpdate({ time: { ...schedule.time, after: parseInt(e.target.value) || 0 } });
                    }
                  }}
                  className="mt-1 h-10 text-sm font-mono"
                />
              </div>
            </div>
          )}
          {schedule.time.kind === 'cron' && (
            <div>
              <Label className="text-[9px]">Cron expression (min hour day month weekday)</Label>
              <Input
                value={schedule.time.cron}
                onChange={e => onUpdate({ time: { kind: 'cron', cron: e.target.value } })}
                placeholder="0 6 * * *"
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Duration</Label>
              <Input
                value={formatDuration(schedule.duration)}
                onChange={e => onUpdate({ duration: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Anchor</Label>
              <select
                value={schedule.anchor}
                onChange={e => onUpdate({ anchor: e.target.value as 'start' | 'finish' })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="start">Start at time</option>
                <option value="finish">Finish at time</option>
              </select>
            </div>
          </div>

          {/* Weekday filter */}
          <div>
            <Label className="text-xs font-medium">Weekdays (none = all)</Label>
            <div className="flex gap-0.5 mt-0.5">
              {ALL_WEEKDAYS.map(w => {
                const active = schedule.weekday?.includes(w) ?? false;
                return (
                  <button
                    key={w}
                    onClick={() => {
                      const current = schedule.weekday ?? [];
                      const next = active ? current.filter(x => x !== w) : [...current, w];
                      onUpdate({ weekday: next.length === 0 ? undefined : next });
                    }}
                    className={`min-h-9 flex-1 rounded border text-[10px] uppercase ${active ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-border bg-background'}`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month filter */}
          <div>
            <Label className="text-xs font-medium">Months (none = all)</Label>
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {ALL_MONTHS.map(m => {
                const active = schedule.month?.includes(m) ?? false;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      const current = schedule.month ?? [];
                      const next = active ? current.filter(x => x !== m) : [...current, m];
                      onUpdate({ month: next.length === 0 ? undefined : next });
                    }}
                    className={`min-h-9 rounded border px-2 text-[10px] uppercase ${active ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-border bg-background'}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seasonal window */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[9px]">From (dd mmm)</Label>
              <Input
                value={schedule.from ?? ''}
                onChange={e => onUpdate({ from: e.target.value || undefined })}
                placeholder="15 Mar"
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-[9px]">Until (dd mmm)</Label>
              <Input
                value={schedule.until ?? ''}
                onChange={e => onUpdate({ until: e.target.value || undefined })}
                placeholder="15 Sep"
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tab 3 — Calendar & Export
// ============================================================================

function CalendarTab({ system }: { system: IrrigationSystem }) {
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [adjustPct, setAdjustPct] = useState<number>(100);
  const [sunTimes, setSunTimes] = useState<Record<string, { sunrise?: string; sunset?: string }>>({});
  const [loadingSun, setLoadingSun] = useState(false);
  const [copiedFmt, setCopiedFmt] = useState<string | null>(null);

  const startDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Fetch sun times from Open-Meteo for the next 7 days
  const fetchSunTimes = useCallback(async () => {
    setLoadingSun(true);
    try {
      const la = parseFloat(lat), ln = parseFloat(lng);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${ln}&daily=sunrise,sunset&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const times: Record<string, { sunrise?: string; sunset?: string }> = {};
      const dates: string[] = data.daily.time;
      const sunrises: string[] = data.daily.sunrise;
      const sunsets: string[] = data.daily.sunset;
      for (let i = 0; i < dates.length; i++) {
        // Open-Meteo returns ISO strings; extract HH:MM in local time
        const sr = sunrises[i]?.split('T')[1]?.slice(0, 5);
        const ss = sunsets[i]?.split('T')[1]?.slice(0, 5);
        times[dates[i]] = { sunrise: sr, sunset: ss };
      }
      setSunTimes(times);
    } catch {
      // Ignore — sun events just won't resolve
    } finally {
      setLoadingSun(false);
    }
  }, [lat, lng]);

  // Auto-fetch on mount
  useEffect(() => { fetchSunTimes(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const events = useMemo(
    () => generateCalendar(system, startDate, 7, sunTimes, adjustPct),
    [system, startDate, sunTimes, adjustPct],
  );

  const stats = useMemo(() => {
    const totalDur = events.reduce((s, e) => s + e.durationSec, 0);
    const byZone: Record<string, number> = {};
    for (const e of events) {
      byZone[e.zoneName] = (byZone[e.zoneName] ?? 0) + e.durationSec;
    }
    const ecoCount = events.filter(e => e.isEcoCycle).length;
    return { totalEvents: events.length, totalDur, byZone, ecoCount };
  }, [events]);

  const yaml = useMemo(() => toYAML(system), [system]);
  const csv = useMemo(() => toCSV(events), [events]);
  const json = useMemo(() => toJSON(system), [system]);

  const copy = (fmt: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFmt(fmt);
    setTimeout(() => setCopiedFmt(null), 2000);
  };

  const download = (fmt: string, text: string, mime: string) => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `irrigation_schedule.${fmt}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group events by day for the calendar grid
  const eventsByDay = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      const day = e.start.slice(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day].push(e);
    }
    return groups;
  }, [events]);

  return (
    <div className="space-y-3">
      {/* Sun times + adjustment */}
      <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 shadow-sm dark:border-cyan-900 dark:bg-cyan-950/20">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
          <Sun className="h-3 w-3" /> Sun Times & Weather Adjustment
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Latitude (for sunrise/sunset)</Label>
            <Input aria-label="Latitude for sunrise and sunset" value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-sm font-mono" />
          </div>
          <div>
            <Label className="text-xs font-medium">Longitude</Label>
            <Input aria-label="Longitude for sunrise and sunset" value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-sm font-mono" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchSunTimes} disabled={loadingSun} className="h-10 gap-1.5 text-xs">
            <RefreshCw className={`h-3 w-3 ${loadingSun ? 'animate-spin' : ''}`} /> Fetch sun times
          </Button>
          <Badge variant="outline" className="text-[9px]">{Object.keys(sunTimes).length} days loaded</Badge>
        </div>
        <div>
          <Label className="text-xs font-medium">Weather adjustment: {adjustPct}% of scheduled time</Label>
          <input
            type="range" min={0} max={150} step={5}
            value={adjustPct}
            onChange={e => setAdjustPct(parseInt(e.target.value))}
            className="w-full h-1.5 mt-1"
          />
          <div className="text-[9px] text-muted-foreground mt-0.5">
            💡 Lower to 50% if rain forecast. Raise to 120% during heat wave. Clamp = zone min/max.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <StatCard icon={CalendarIcon} color="cyan" label="Events (7 days)" value={String(stats.totalEvents)} />
        <StatCard icon={Clock} color="emerald" label="Total run time" value={formatDuration(stats.totalDur)} />
        <StatCard icon={Zap} color="amber" label="Eco cycles" value={String(stats.ecoCount)} />
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border bg-background p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarIcon className="h-3 w-3" /> 7-Day Calendar
        </div>
        <div className="space-y-1.5">
          {Object.entries(eventsByDay).map(([day, dayEvents]) => (
            <div key={day} className="rounded-lg border-l-4 border-cyan-400 bg-cyan-50/30 py-2 pl-3 dark:bg-cyan-950/10">
              <div className="text-[10px] font-mono text-muted-foreground mb-0.5">
                {new Date(day + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                <span className="ml-2 text-foreground">{dayEvents.length} run{dayEvents.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {dayEvents.map((e, i) => (
                  <div
                    key={i}
                    className="text-[9px] font-mono rounded px-1.5 py-0.5 border"
                    style={{
                      backgroundColor: e.isEcoCycle ? 'rgba(245, 158, 11, 0.15)' : 'rgba(8, 145, 178, 0.15)',
                      borderColor: e.isEcoCycle ? '#f59e0b' : '#0891b2',
                      color: e.isEcoCycle ? '#92400e' : '#155e75',
                    }}
                    title={`${e.controllerName} → ${e.zoneName}${e.sequenceName ? ` (${e.sequenceName})` : ''}\n${e.start.slice(11)} → ${e.end.slice(11)}\nDuration: ${formatDuration(e.durationSec)}${e.isEcoCycle ? `\nEco cycle ${(e.ecoCycleIndex ?? 0) + 1}` : ''}`}
                  >
                    {e.start.slice(11, 16)} {e.zoneName}
                    {e.isEcoCycle && ` ⚡${(e.ecoCycleIndex ?? 0) + 1}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <EmptyState
              icon={CalendarIcon}
              title="No events scheduled"
              description="Add schedules in the Schedules tab — pick a crop, set a time, and your 7-day calendar will fill in automatically."
              color="#0ea5e9"
              variant="compact"
              action={{ label: "Go to Schedules", onClick: () => {/* user switches tabs manually */} }}
            />
          )}
        </div>
      </div>

      {/* By-zone breakdown */}
      {Object.keys(stats.byZone).length > 0 && (
        <div className="rounded-xl border bg-muted/20 p-3 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total run time by zone (7 days)</div>
          <div className="space-y-1">
            {Object.entries(stats.byZone).sort((a, b) => b[1] - a[1]).map(([zone, dur]) => {
              const pct = stats.totalDur > 0 ? (dur / stats.totalDur) * 100 : 0;
              return (
                <div key={zone} className="flex items-center gap-2 text-[10px]">
                  <span className="w-32 truncate">{zone}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 text-right font-mono">{formatDuration(dur)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Export and backup</div>

        {/* YAML */}
        <ExportBlock
          icon={FileCode}
          color="cyan"
          title="YAML (Home Assistant — Irrigation Unlimited)"
          description="Drop into configuration.yaml → irrigation_unlimited: key. Compatible with the popular HA integration."
          text={yaml}
          fmt="yaml"
          mime="text/yaml"
          copied={copiedFmt === 'yaml'}
          onCopy={() => copy('yaml', yaml)}
          onDownload={() => download('yaml', yaml, 'text/yaml')}
        />

        {/* CSV */}
        <ExportBlock
          icon={FileSpreadsheet}
          color="emerald"
          title="CSV Calendar (Google Calendar / Excel)"
          description="One row per scheduled run. Import to Google Calendar via 'Import CSV' or open in Excel."
          text={csv}
          fmt="csv"
          mime="text/csv"
          copied={copiedFmt === 'csv'}
          onCopy={() => copy('csv', csv)}
          onDownload={() => download('csv', csv, 'text/csv')}
        />

        {/* JSON */}
        <ExportBlock
          icon={FileJson}
          color="violet"
          title="JSON (re-importable backup)"
          description="Full system definition. Save as backup or transfer to another device."
          text={json}
          fmt="json"
          mime="application/json"
          copied={copiedFmt === 'json'}
          onCopy={() => copy('json', json)}
          onDownload={() => download('json', json, 'application/json')}
        />
      </div>

      <div className="rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        💡 All data persists in your browser's localStorage. Use JSON export for backups. The YAML format is compatible with the <a href="https://github.com/rgc99/irrigation_unlimited" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Irrigation Unlimited</a> Home Assistant integration — configure visually here, then deploy to HA.
      </div>
    </div>
  );
}

// ============================================================================
// Shared components
// ============================================================================

function ExportBlock({ icon: Icon, color, title, description, text, fmt, mime, copied, onCopy, onDownload }: {
  icon: typeof FileCode;
  color: string;
  title: string;
  description: string;
  text: string;
  fmt: string;
  mime: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ACCENT: Record<string, string> = {
    cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/30 dark:bg-cyan-950/10',
    emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10',
    violet: 'border-violet-200 dark:border-violet-900 bg-violet-50/30 dark:bg-violet-950/10',
  };
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${ACCENT[color]}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: `var(--${color}-600, #0891b2)` }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-snug">{title}</div>
          <div className="text-[10px] text-muted-foreground">{description}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onCopy} className="h-10 gap-1 text-xs">
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} Copy
            </Button>
            <Button size="sm" onClick={onDownload} className="h-10 gap-1 text-xs">
              <Download className="h-3 w-3" /> .{fmt}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)} className="h-10 text-xs sm:ml-auto">
              {expanded ? 'Hide' : 'Preview'}
            </Button>
          </div>
          {expanded && (
            <Textarea
              value={text}
              readOnly
              className="text-[9px] font-mono min-h-[200px] mt-2 bg-background"
            />
          )}
        </div>
      </div>
    </div>
  );
}

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
};

function StatCard({ icon: Icon, color, label, value }: {
  icon: typeof Clock; color: keyof typeof ACCENT_BG; label: string; value: string;
}) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${ACCENT_BG[color]}`}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-2.5 w-2.5" />{label}
      </div>
      <div className="font-mono text-sm font-semibold leading-tight">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Clock; label: string }) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${active ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300' : 'text-muted-foreground hover:bg-muted/50'}`}
    >
      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
    </button>
  );
}
