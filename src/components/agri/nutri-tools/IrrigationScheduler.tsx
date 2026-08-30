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
import { copyFor, useTranslation } from '@/lib/language-store';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock, Plus, Trash2, Download, Copy, Check, Calendar as CalendarIcon,
  Settings, Layers, Zap, Sun, RefreshCw,
  Play, Pause, ChevronRight, FileJson, FileCode, FileSpreadsheet,
  Bell, Flame, Droplets, Send, RotateCcw,
} from 'lucide-react';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  type IrrigationSystem, type Controller, type Zone, type Schedule, type Sequence, type SequenceZone,
  type Weekday, type Month, type ScheduleTime, type DayFilter,
  type Duration, type CalendarEvent,
  ALL_WEEKDAYS, ALL_MONTHS,
  generateCalendar, formatDuration, parseDuration, formatTimeOfDay,
  toYAML, toCSV, toJSON, fromJSON, createDefaultSystem, genId,
} from '@/lib/irrigation-scheduler';
import {
  initOneSignalSDK,
  requestPushPermission,
  sendDroughtStressPushAlert,
  getOneSignalAppId,
  getSavedOneSignalSettings,
  saveOneSignalSettings,
  type OneSignalSettings,
} from '@/lib/onesignal';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'irrigation_scheduler_v1';
const MULTI_FIELDS_KEY = 'nutriplant_fields_v1';

const TITLE: TrilingualString = {
  en: 'Irrigation Scheduler',
  ar: 'جدولة الري',
  fr: "Planificateur d'Irrigation",
};

const DESC: TrilingualString = {
  en: 'Design controllers, zones, schedules, and sequences — then generate a 7-day calendar and export to YAML / CSV / JSON. Compatible with the Irrigation Unlimited Home Assistant integration.',
  ar: 'صمّم وحدات التحكم والمناطق والجداول والتسلسلات، ثم أنشئ تقويمًا لسبعة أيام وصدّر إلى YAML / CSV / JSON. متوافق مع تكامل Irrigation Unlimited في Home Assistant.',
  fr: "Concevez contrôleurs, zones, programmations et séquences — puis générez un calendrier sur 7 jours et exportez en YAML / CSV / JSON. Compatible avec l'intégration Irrigation Unlimited de Home Assistant.",
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Preamble opens the master valve before any zone (pump prime). Postamble keeps it open after zones close (prevents water hammer). Eco-mode enables cycle-and-soak for clay soils to prevent runoff. Sun events use Open-Meteo sunrise/sunset from the location configured on the Calendar tab.',
  ar: 'التهيئة تفتح الصمام الرئيسي قبل أي منطقة (تشغيل المضخة). الختام يبقيه مفتوحًا بعد إغلاق المناطق (يمنع المطرقة المائية). الوضع الاقتصادي يفعّل الدورات والنقع للتربة الطينية لمنع الجريان السطحي. تستخدم أحداث الشمس وقت الشروق والغروب من Open-Meteo وموقع تبويب التقويم.',
  fr: "Le préambule ouvre la vanne maîtresse avant toute zone (amorçage pompe). Le postambule la maintient ouverte après fermeture (évite le coup de bélier). L'éco-mode active cycle-et-trempage pour sols argileux. Les événements solaires utilisent les lever/coucher Open-Meteo de l'onglet Calendrier.",
};

type Tab = 'zones' | 'schedules' | 'calendar' | 'drought-alerts';

interface SavedField {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
}

export function IrrigationScheduler() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [tab, setTab] = useState<Tab>('zones');
  const [system, setSystem] = useState<IrrigationSystem | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

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

  const handleCopySummary = () => {
    if (!system) return;
    const totalZones = system.controllers.reduce((s, c) => s + c.zones.length, 0);
    const totalSchedules = system.controllers.reduce(
      (s, c) => s + c.zones.reduce((z, zz) => z + zz.schedules.length, 0),
      0,
    );
    const ecoZones = system.controllers.reduce(
      (s, c) => s + c.zones.filter(z => z.ecoMode).length,
      0,
    );
    const lines: string[] = [];
    lines.push('=== IRRIGATION SCHEDULER SUMMARY ===');
    lines.push(`Controllers: ${system.controllers.length}`);
    lines.push(`Zones: ${totalZones}`);
    lines.push(`Schedules: ${totalSchedules}`);
    lines.push(`Eco-mode zones: ${ecoZones}`);
    lines.push('');
    lines.push('Controllers:');
    for (const c of system.controllers) {
      const cScheds = c.zones.reduce((z, zz) => z + zz.schedules.length, 0);
      lines.push(`  - ${c.name} (${c.zones.length} zones, ${cScheds} schedules)`);
      for (const z of c.zones) {
        const tags: string[] = [];
        if (z.crop) tags.push(`[${z.crop}]`);
        if (z.stage) tags.push(`(${z.stage})`);
        if (z.ecoMode) tags.push('⚡eco');
        tags.push(z.enabled ? '✓' : '✗');
        lines.push(`    • ${z.name} ${tags.join(' ')} — ${z.schedules.length} schedule(s)`);
      }
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleReset = () => {
    setSystem(createDefaultSystem());
    setTab('zones');
    toast({
      title: tr('Reset to default system', 'تمت الاستعادة للنظام الافتراضي', 'Réinitialisé'),
      description: tr('All controllers, zones, and schedules restored to defaults.', 'تمت استعادة جميع وحدات التحكم والمناطق والجداول إلى الإعدادات الافتراضية.', 'Tous les contrôleurs, zones et programmations ont été réinitialisés.'),
    });
  };

  if (!system) {
    return <div className="text-xs text-muted-foreground p-4">Loading…</div>;
  }

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge="Irrigation Unlimited"
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopySummary,
          variant: 'primary',
          showCheck: copiedSummary,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <div className="lg:col-span-12 space-y-4">
        {/* Tab navigation */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-background/70 p-1 sm:grid-cols-4">
          <TabBtn active={tab === 'zones'} onClick={() => setTab('zones')} icon={Settings} label={copyFor(language, 'Zones', 'المناطق', 'Zones')} />
          <TabBtn active={tab === 'schedules'} onClick={() => setTab('schedules')} icon={CalendarIcon} label={copyFor(language, 'Schedules', 'الجداول', 'Programmations')} />
          <TabBtn active={tab === 'calendar'} onClick={() => setTab('calendar')} icon={Layers} label={copyFor(language, 'Calendar & Export', 'التقويم والتصدير', 'Calendrier & Export')} />
          <TabBtn active={tab === 'drought-alerts'} onClick={() => setTab('drought-alerts')} icon={Flame} label={copyFor(language, 'Drought Alerts', 'تنبيهات الجفاف', 'Alertes Sécheresse')} />
        </div>

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
        {tab === 'drought-alerts' && (
          <DroughtAlertsTab
            system={system}
            onUpdateZone={updateZone}
          />
        )}
      </div>
    </CalculatorShell>
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
  const { language } = useTranslation();
  return (
    <div className="space-y-3">
      {system.controllers.map(c => (
        <div key={c.id} className="space-y-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
          {/* Controller header */}
          <div className="flex items-center gap-2 flex-wrap">
            <Settings className="h-4 w-4 text-cyan-600" />
            <Input aria-label={copyFor(language, 'Controller name', 'اسم وحدة التحكم')}
              value={c.name}
              onChange={e => onUpdateController(c.id, { name: e.target.value })}
              className="h-10 min-w-[140px] flex-1 text-sm font-semibold"
            />
            <Badge variant={c.enabled ? 'default' : 'outline'} className="text-[9px]">{c.enabled ? 'ON' : 'OFF'}</Badge>
          </div>

          {/* Controller settings */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Preamble (pump prime)', 'التهيئة (تشغيل المضخة)')}</Label>
              <Input
                value={formatDuration(c.preamble)}
                onChange={e => onUpdateController(c.id, { preamble: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Postamble (drain)', 'الختام (تصريف المياه)')}</Label>
              <Input
                value={formatDuration(c.postamble)}
                onChange={e => onUpdateController(c.id, { postamble: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Master valve entity', 'معرّف الصمام الرئيسي')}</Label>
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
              <Layers className="h-3 w-3" /> {copyFor(language, 'Zones', 'المناطق')} ({c.zones.length})
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
            <Plus className="h-3.5 w-3.5" /> {copyFor(language, 'Add Zone', 'إضافة منطقة')}
          </Button>
        </div>
      ))}

      <div className="rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        💡 <strong>{copyFor(language, 'Preamble', 'التهيئة')}</strong> = {copyFor(language, 'master valve opens before any zone (pump prime)', 'يفتح الصمام الرئيسي قبل أي منطقة لتشغيل المضخة')}. <strong>{copyFor(language, 'Postamble', 'الختام')}</strong> = {copyFor(language, 'master stays on after zones close (prevents water hammer)', 'يبقى الصمام الرئيسي مفتوحًا بعد إغلاق المناطق لمنع المطرقة المائية')}. <strong>{copyFor(language, 'Eco-mode', 'الوضع الاقتصادي')}</strong> = {copyFor(language, 'cycle-and-soak for clay soils to prevent runoff', 'دورات ونقع للتربة الطينية لمنع الجريان السطحي')}.
      </div>
    </div>
  );
}

function ZoneRow({ zone, onUpdate, onDelete }: {
  zone: Zone;
  onUpdate: (patch: Partial<Zone>) => void;
  onDelete: () => void;
}) {
  const { language } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState<SavedField[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MULTI_FIELDS_KEY);
      if (raw) setFields(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="flex items-center gap-2 p-2.5">
        <button
          aria-label={expanded ? `${copyFor(language, 'Collapse', 'طيّ')} ${zone.name}` : `${copyFor(language, 'Expand', 'توسيع')} ${zone.name}`}
          onClick={() => setExpanded(e => !e)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <Input
          aria-label={copyFor(language, 'Zone name', 'اسم المنطقة')}
          value={zone.name}
          onChange={e => onUpdate({ name: e.target.value })}
          className="h-10 min-w-0 flex-1 text-sm"
        />
        {zone.crop && (
          <Badge variant="outline" className="text-[10px] uppercase font-mono hidden sm:inline-flex">
            {zone.crop}
          </Badge>
        )}
        <Badge variant={zone.enabled ? 'default' : 'outline'} className="text-[9px]">{zone.enabled ? 'ON' : 'OFF'}</Badge>
        <button
          aria-label={zone.enabled ? `${copyFor(language, 'Pause', 'إيقاف')} ${zone.name}` : `${copyFor(language, 'Enable', 'تفعيل')} ${zone.name}`}
          onClick={() => onUpdate({ enabled: !zone.enabled })}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {zone.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button aria-label={`${copyFor(language, 'Delete', 'حذف')} ${zone.name}`} onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {expanded && (
        <div className="space-y-3 border-t bg-muted/10 p-3">
          {/* Associated Field & Crop */}
          <div className="rounded-xl border border-cyan-200/70 bg-cyan-50/30 p-3 dark:border-cyan-900/60 dark:bg-cyan-950/20">
            <div className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 mb-2 flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-cyan-600" />
              {copyFor(language, 'Crop & Field Link (for Drought Stress Alerting)', 'ربط المحصول والحقل (لتنبيهات إجهاد الجفاف)')}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs font-medium">{copyFor(language, 'Linked Field', 'الحقل المرتبط')}</Label>
                <select
                  value={zone.fieldId || ''}
                  onChange={e => {
                    const fid = e.target.value;
                    const matched = fields.find(f => f.id === fid);
                    onUpdate({
                      fieldId: fid,
                      crop: matched ? matched.crop : zone.crop || 'tomato',
                    });
                  }}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">{copyFor(language, '— Manual / Unlinked —', '— يدوي / غير مرتبط —')}</option>
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.crop})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium">{copyFor(language, 'Crop Type', 'نوع المحصول')}</Label>
                <Input
                  value={zone.crop || ''}
                  onChange={e => onUpdate({ crop: e.target.value })}
                  placeholder="e.g. Tomato, Maize"
                  className="mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">{copyFor(language, 'Growth Stage', 'مرحلة النمو')}</Label>
                <select
                  value={zone.stage || 'vegetative'}
                  onChange={e => onUpdate({ stage: e.target.value as Zone['stage'] })}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="establishment">{copyFor(language, 'Establishment', 'التأسيس')}</option>
                  <option value="vegetative">{copyFor(language, 'Vegetative', 'النمو الخضري')}</option>
                  <option value="flowering">{copyFor(language, 'Flowering (High Sensitivity)', 'الإزهار (حساسية عالية)')}</option>
                  <option value="filling">{copyFor(language, 'Grain / Fruit Fill', 'امتلاء الحبوب / الثمار')}</option>
                  <option value="maturation">{copyFor(language, 'Maturation', 'النضج')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Min run time', 'الحد الأدنى لمدة التشغيل')}</Label>
              <Input
                value={formatDuration(zone.minimum)}
                onChange={e => onUpdate({ minimum: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Default duration', 'المدة الافتراضية')}</Label>
              <Input
                value={formatDuration(zone.duration)}
                onChange={e => onUpdate({ duration: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Max run time (opt)', 'الحد الأقصى لمدة التشغيل (اختياري)')}</Label>
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
              <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">{copyFor(language, 'Eco-Mode (Cycle & Soak)', 'الوضع الاقتصادي (دورات ونقع)')}</span>
              <Badge variant={zone.ecoMode ? 'default' : 'outline'} className="text-[9px] ml-auto">{zone.ecoMode ? 'ON' : 'OFF'}</Badge>
            </div>
            {zone.ecoMode ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[9px]">{copyFor(language, 'On (sec)', 'تشغيل (ثانية)')}</Label>
                  <Input
                    type="number" min={10}
                    value={zone.ecoMode.onSec}
                    onChange={e => onUpdate({ ecoMode: { ...zone.ecoMode!, onSec: Math.max(10, parseInt(e.target.value) || 300) } })}
                    className="mt-1 h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[9px]">{copyFor(language, 'Off (sec)', 'إيقاف (ثانية)')}</Label>
                  <Input
                    type="number" min={0}
                    value={zone.ecoMode.offSec}
                    onChange={e => onUpdate({ ecoMode: { ...zone.ecoMode!, offSec: Math.max(0, parseInt(e.target.value) || 60) } })}
                    className="mt-1 h-10 text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[9px]">{copyFor(language, 'Repeat', 'التكرار')}</Label>
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
                <Plus className="h-3 w-3" /> {copyFor(language, 'Enable cycle-and-soak', 'تفعيل الدورات والنقع')}
              </Button>
            )}
          </div>

          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Valve entity (for YAML export)', 'معرّف الصمام (لتصدير YAML)')}</Label>
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
  const { language } = useTranslation();
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
                <Badge variant="outline" className="text-[9px]">{z.schedules.length} {copyFor(language, z.schedules.length === 1 ? 'schedule' : 'schedules', z.schedules.length === 1 ? 'جدول' : 'جداول')}</Badge>
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
                <Plus className="h-3 w-3" /> {copyFor(language, 'Add Schedule', 'إضافة جدول')}
              </Button>
            </div>
          ))}
        </div>
      ))}
      <div className="rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        💡 <strong>{copyFor(language, 'Anchor = start', 'التثبيت = البدء')}</strong> = {copyFor(language, 'run begins at the time', 'يبدأ التشغيل في الوقت المحدد')}. <strong>{copyFor(language, 'Anchor = finish', 'التثبيت = الانتهاء')}</strong> = {copyFor(language, 'run ends at the time', 'ينتهي التشغيل في الوقت المحدد')}. {copyFor(language, "Sun events use Open-Meteo sunrise/sunset from the ET Tracker's location (configure on the Calendar tab).", 'تستخدم أحداث الشمس وقت الشروق والغروب من Open-Meteo وموقع أداة تتبع البخر-نتح (اضبط الموقع في تبويب التقويم).')}
      </div>
    </div>
  );
}

function ScheduleRow({ schedule, onUpdate, onDelete }: {
  schedule: Schedule;
  onUpdate: (patch: Partial<Schedule>) => void;
  onDelete: () => void;
}) {
  const { language } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border bg-muted/10 shadow-sm">
      <div className="flex items-center gap-1.5 p-2.5">
        <button aria-label={expanded ? `${copyFor(language, 'Collapse', 'طيّ')} ${schedule.name}` : `${copyFor(language, 'Expand', 'توسيع')} ${schedule.name}`} onClick={() => setExpanded(e => !e)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <Input
          aria-label={copyFor(language, 'Schedule name', 'اسم الجدول')}
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
        <button aria-label={schedule.enabled ? `${copyFor(language, 'Pause', 'إيقاف')} ${schedule.name}` : `${copyFor(language, 'Enable', 'تفعيل')} ${schedule.name}`} onClick={() => onUpdate({ enabled: !schedule.enabled })} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          {schedule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button aria-label={`${copyFor(language, 'Delete', 'حذف')} ${schedule.name}`} onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30">
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
                {k === 'absolute' ? copyFor(language, 'Time', 'الوقت') : k === 'sun' ? copyFor(language, 'Sun', 'الشمس') : 'Cron'}
              </button>
            ))}
          </div>

          {schedule.time.kind === 'absolute' && (
            <div>
              <Label className="text-[9px]">{copyFor(language, 'Time (HH:MM)', 'الوقت (HH:MM)')}</Label>
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
                <Label className="text-[9px]">{copyFor(language, 'Event', 'الحدث')}</Label>
                <select
                  value={schedule.time.sun}
                  onChange={e => {
                    if (schedule.time.kind === 'sun') {
                      onUpdate({ time: { ...schedule.time, sun: e.target.value as 'sunrise' | 'sunset' } });
                    }
                  }}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="sunrise">{copyFor(language, 'Sunrise', 'الشروق')}</option>
                  <option value="sunset">{copyFor(language, 'Sunset', 'الغروب')}</option>
                </select>
              </div>
              <div>
                <Label className="text-[9px]">{copyFor(language, 'Before (sec)', 'قبل (ثانية)')}</Label>
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
                <Label className="text-[9px]">{copyFor(language, 'After (sec)', 'بعد (ثانية)')}</Label>
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
              <Label className="text-[9px]">{copyFor(language, 'Cron expression (min hour day month weekday)', 'تعبير Cron (الدقيقة الساعة اليوم الشهر يوم الأسبوع)')}</Label>
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
              <Label className="text-xs font-medium">{copyFor(language, 'Duration', 'المدة')}</Label>
              <Input
                value={formatDuration(schedule.duration)}
                onChange={e => onUpdate({ duration: parseDuration(e.target.value) })}
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Anchor', 'التثبيت')}</Label>
              <select
                value={schedule.anchor}
                onChange={e => onUpdate({ anchor: e.target.value as 'start' | 'finish' })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="start">{copyFor(language, 'Start at time', 'البدء في الوقت')}</option>
                <option value="finish">{copyFor(language, 'Finish at time', 'الانتهاء في الوقت')}</option>
              </select>
            </div>
          </div>

          {/* Weekday filter */}
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Weekdays (none = all)', 'أيام الأسبوع (بدون اختيار = الكل)')}</Label>
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
            <Label className="text-xs font-medium">{copyFor(language, 'Months (none = all)', 'الأشهر (بدون اختيار = الكل)')}</Label>
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
              <Label className="text-[9px]">{copyFor(language, 'From (dd mmm)', 'من (يوم شهر)')}</Label>
              <Input
                value={schedule.from ?? ''}
                onChange={e => onUpdate({ from: e.target.value || undefined })}
                placeholder="15 Mar"
                className="mt-1 h-10 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-[9px]">{copyFor(language, 'Until (dd mmm)', 'حتى (يوم شهر)')}</Label>
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
  const { language } = useTranslation();
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
  useEffect(() => { fetchSunTimes(); }, []);

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
          <Sun className="h-3 w-3" /> {copyFor(language, 'Sun Times & Weather Adjustment', 'أوقات الشمس وضبط الطقس')}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Latitude (for sunrise/sunset)', 'خط العرض (للشروق والغروب)')}</Label>
            <Input aria-label={copyFor(language, 'Latitude for sunrise and sunset', 'خط العرض للشروق والغروب')} value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-sm font-mono" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Longitude', 'خط الطول')}</Label>
            <Input aria-label={copyFor(language, 'Longitude for sunrise and sunset', 'خط الطول للشروق والغروب')} value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-sm font-mono" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchSunTimes} disabled={loadingSun} className="h-10 gap-1.5 text-xs">
            <RefreshCw className={`h-3 w-3 ${loadingSun ? 'animate-spin' : ''}`} /> {copyFor(language, 'Fetch sun times', 'جلب أوقات الشمس')}
          </Button>
          <Badge variant="outline" className="text-[9px]">{Object.keys(sunTimes).length} {copyFor(language, 'days loaded', 'أيام محمّلة')}</Badge>
        </div>
        <div>
          <Label className="text-xs font-medium">{copyFor(language, 'Weather adjustment', 'ضبط الطقس')}: {adjustPct}% {copyFor(language, 'of scheduled time', 'من وقت التشغيل المجدول')}</Label>
          <input
            type="range" min={0} max={150} step={5}
            value={adjustPct}
            onChange={e => setAdjustPct(parseInt(e.target.value))}
            className="w-full h-1.5 mt-1"
          />
          <div className="text-[9px] text-muted-foreground mt-0.5">
            💡 {copyFor(language, 'Lower to 50% if rain forecast. Raise to 120% during heat wave. Clamp = zone min/max.', 'اخفضها إلى 50٪ عند توقع المطر، وارفعها إلى 120٪ أثناء موجة الحر. يلتزم الضبط بالحد الأدنى والأقصى للمنطقة.')}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <StatCard icon={CalendarIcon} color="cyan" label={copyFor(language, 'Events (7 days)', 'الأحداث (7 أيام)')} value={String(stats.totalEvents)} />
        <StatCard icon={Clock} color="emerald" label={copyFor(language, 'Total run time', 'إجمالي وقت التشغيل')} value={formatDuration(stats.totalDur)} />
        <StatCard icon={Zap} color="amber" label={copyFor(language, 'Eco cycles', 'الدورات الاقتصادية')} value={String(stats.ecoCount)} />
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border bg-background p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarIcon className="h-3 w-3" /> {copyFor(language, '7-Day Calendar', 'تقويم 7 أيام')}
        </div>
        <div className="space-y-1.5">
          {Object.entries(eventsByDay).map(([day, dayEvents]) => (
            <div key={day} className="rounded-lg border-l-4 border-cyan-400 bg-cyan-50/30 py-2 pl-3 dark:bg-cyan-950/10">
              <div className="text-[10px] font-mono text-muted-foreground mb-0.5">
                {new Date(day + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                <span className="ml-2 text-foreground">{dayEvents.length} {copyFor(language, dayEvents.length === 1 ? 'run' : 'runs', dayEvents.length === 1 ? 'تشغيل' : 'عمليات تشغيل')}</span>
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
                    title={`${e.controllerName} → ${e.zoneName}${e.sequenceName ? ` (${e.sequenceName})` : ''}\n${e.start.slice(11)} → ${e.end.slice(11)}\n${copyFor(language, 'Duration', 'المدة')}: ${formatDuration(e.durationSec)}${e.isEcoCycle ? `\n${copyFor(language, 'Eco cycle', 'دورة اقتصادية')} ${(e.ecoCycleIndex ?? 0) + 1}` : ''}`}
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
              title={copyFor(language, 'No events scheduled', 'لا توجد أحداث مجدولة')}
              description={copyFor(language, 'Add schedules in the Schedules tab — pick a crop, set a time, and your 7-day calendar will fill in automatically.', 'أضف جداول في تبويب الجداول، واختر وقتًا، وسيُملأ تقويم الأيام السبعة تلقائيًا.')}
              color="#0ea5e9"
              variant="compact"
              action={{ label: copyFor(language, 'Go to Schedules', 'الانتقال إلى الجداول'), onClick: () => {/* user switches tabs manually */} }}
            />
          )}
        </div>
      </div>

      {/* By-zone breakdown */}
      {Object.keys(stats.byZone).length > 0 && (
        <div className="rounded-xl border bg-muted/20 p-3 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Total run time by zone (7 days)', 'إجمالي وقت التشغيل حسب المنطقة (7 أيام)')}</div>
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
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Export and backup', 'التصدير والنسخ الاحتياطي')}</div>

        {/* YAML */}
        <ExportBlock
          icon={FileCode}
          color="cyan"
          title={copyFor(language, 'YAML (Home Assistant — Irrigation Unlimited)', 'YAML (Home Assistant — Irrigation Unlimited)')}
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
          title={copyFor(language, 'CSV Calendar (Google Calendar / Excel)', 'تقويم CSV (تقويم Google / Excel)')}
          description={copyFor(language, "One row per scheduled run. Import to Google Calendar via 'Import CSV' or open in Excel.", 'صف واحد لكل عملية تشغيل مجدولة. استورد الملف إلى تقويم Google عبر «استيراد CSV» أو افتحه في Excel.')}
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
          title={copyFor(language, 'JSON (re-importable backup)', 'JSON (نسخة احتياطية قابلة لإعادة الاستيراد)')}
          description={copyFor(language, 'Full system definition. Save as backup or transfer to another device.', 'تعريف النظام كاملًا. احفظه كنسخة احتياطية أو انقله إلى جهاز آخر.')}
          text={json}
          fmt="json"
          mime="application/json"
          copied={copiedFmt === 'json'}
          onCopy={() => copy('json', json)}
          onDownload={() => download('json', json, 'application/json')}
        />
      </div>

      <div className="rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        💡 {copyFor(language, "All data persists in your browser's localStorage. Use JSON export for backups. The YAML format is compatible with the Irrigation Unlimited Home Assistant integration — configure visually here, then deploy to HA.", 'تُحفظ جميع البيانات في localStorage بمتصفحك. استخدم تصدير JSON للنسخ الاحتياطية. يتوافق تنسيق YAML مع تكامل Irrigation Unlimited في Home Assistant؛ اضبط النظام بصريًا هنا ثم انشره على HA.')}
      </div>
    </div>
  );
}

// ============================================================================
// Tab 4 — Drought Alerts & OneSignal Push Integration
// ============================================================================

function DroughtAlertsTab({
  system,
  onUpdateZone,
}: {
  system: IrrigationSystem;
  onUpdateZone: (controllerId: string, zoneId: string, patch: Partial<Zone>) => void;
}) {
  const { language } = useTranslation();
  const [settings, setSettings] = useState<OneSignalSettings>(getSavedOneSignalSettings());
  const [appId, setAppId] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [activeTab, setActiveTab] = useState<'monitor' | 'settings'>('monitor');
  const [sendingZoneId, setSendingZoneId] = useState<string | null>(null);

  // Global ET0 & Rain parameters for stress calculation
  const [globalEt0, setGlobalEt0] = useState('5.2');
  const [globalRain, setGlobalRain] = useState('0.0');

  useEffect(() => {
    initOneSignalSDK();
    setAppId(getOneSignalAppId());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleUpdateSettings = (patch: Partial<OneSignalSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveOneSignalSettings(updated);
  };

  const handleEnablePush = async () => {
    const perm = await requestPushPermission();
    setPermission(perm);
    if (perm === 'granted') {
      toast({
        title: copyFor(language, 'Push Notifications Enabled', 'تم تفعيل إشعارات الدفع'),
        description: copyFor(language, 'You will receive instant alerts when drought stress spikes.', 'ستتلقى تنبيهات فورية عند ارتفاع إجهاد الجفاف.'),
      });
    }
  };

  // Flatten all zones with their parent controller
  const allZones = useMemo(() => {
    const list: Array<{ controller: Controller; zone: Zone }> = [];
    system.controllers.forEach(c => {
      c.zones.forEach(z => {
        list.push({ controller: c, zone: z });
      });
    });
    return list;
  }, [system]);

  // Calculate stress for each zone
  const zoneCalculations = useMemo(() => {
    const et = parseFloat(globalEt0) || 5.0;
    const rain = parseFloat(globalRain) || 0.0;
    const deficit = Math.max(0, et - rain * 0.8);

    return allZones.map(({ controller, zone }) => {
      const taw = zone.tawMm || 100;
      const sw = zone.soilWaterMm !== undefined ? zone.soilWaterMm : 40;
      const depletionPct = Math.max(0, Math.min(100, ((taw - sw) / taw) * 100));

      const stageSensitivity: Record<string, number> = {
        establishment: 0.5,
        vegetative: 0.7,
        flowering: 1.0,
        filling: 0.9,
        maturation: 0.5,
      };
      const sf = stageSensitivity[zone.stage || 'vegetative'] ?? 0.7;
      const dsi = (deficit / et) * 0.4 + (depletionPct / 100) * 0.4 + sf * 0.2;
      const dsiScore = Math.min(100, Math.round(dsi * 100));

      let level: 'mild' | 'moderate' | 'severe' | 'critical';
      let badgeColor: string;
      let advice: string;

      if (dsiScore < 30) {
        level = 'mild';
        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300';
        advice = copyFor(language, 'Soil moisture optimal; adequate transpiration.', 'رطوبة التربة ممتازة؛ البخر نتح مناسب.');
      } else if (dsiScore < 60) {
        level = 'moderate';
        badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300';
        advice = copyFor(language, 'Mild-moderate stress; consider scheduling next cycle within 48h.', 'إجهاد خفيف-متوسط؛ برمج دورة الري خلال 48 ساعة.');
      } else if (dsiScore < 80) {
        level = 'severe';
        badgeColor = 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300';
        advice = copyFor(language, 'High stress! Immediate irrigation recommended to prevent yield penalty.', 'إجهاد مرتفع! يوصى بالري الفوري لتفادي نقص المحصول.');
      } else {
        level = 'critical';
        badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300';
        advice = copyFor(language, 'Critical drought stress! Immediate emergency irrigation required!', 'إجهاد جفاف حرج! يلزم ري طوارئ فوري!');
      }

      const isHighStress = dsiScore >= settings.droughtStressThreshold;

      return {
        controller,
        zone,
        dsiScore,
        level,
        badgeColor,
        advice,
        isHighStress,
        sw,
        taw,
        depletionPct,
      };
    });
  }, [allZones, globalEt0, globalRain, settings.droughtStressThreshold, language]);

  const highStressCount = useMemo(
    () => zoneCalculations.filter(z => z.isHighStress).length,
    [zoneCalculations]
  );

  const handleTriggerAlert = async (calc: (typeof zoneCalculations)[0]) => {
    setSendingZoneId(calc.zone.id);

    try {
      const title = `🚨 High Drought Stress Alert: ${calc.zone.name} (${calc.controller.name})`;
      const message = `${calc.zone.crop || 'Crop'} (${calc.zone.stage || 'vegetative'}) has reached ${calc.level.toUpperCase()} drought stress (DSI ${calc.dsiScore}/100). ${calc.advice}`;

      const res = await sendDroughtStressPushAlert({
        title,
        message,
        fieldId: calc.zone.fieldId,
        fieldName: calc.zone.name,
        crop: calc.zone.crop,
        dsiScore: calc.dsiScore,
        level: calc.level,
        url: '/app?tab=irrigation-scheduler',
      });

      // Update zone last check record
      onUpdateZone(calc.controller.id, calc.zone.id, {
        lastDsiScore: calc.dsiScore,
        lastDsiCheck: new Date().toISOString(),
      });

      toast({
        title: copyFor(language, 'OneSignal Alert Dispatched', 'تم إرسال تنبيه OneSignal'),
        description: copyFor(
          language,
          `Triggered for "${calc.zone.name}" via ${res.channel} (${res.details || 'OK'})`,
          `تم الإرسال لـ "${calc.zone.name}" عبر ${res.channel}`
        ),
      });
    } catch {
      toast({
        title: copyFor(language, 'Alert Failed', 'فشل الإرسال'),
        description: copyFor(language, 'Could not send push notification', 'تعذر إرسال الإشعار'),
        variant: 'destructive',
      });
    } finally {
      setSendingZoneId(null);
    }
  };

  const handleBroadcastAllHighStress = async () => {
    const highStressZones = zoneCalculations.filter(z => z.isHighStress);
    if (highStressZones.length === 0) return;

    for (const calc of highStressZones) {
      await handleTriggerAlert(calc);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Integration status */}
      <div className="rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-background to-blue-50/40 p-4 dark:border-cyan-900/60 dark:from-cyan-950/30 dark:to-blue-950/20 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>{copyFor(language, 'OneSignal Drought Stress Alerting', 'نظام تنبيهات إجهاد الجفاف عبر OneSignal')}</span>
                {permission === 'granted' ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[9px] gap-1">
                    <Check className="h-2.5 w-2.5" /> {copyFor(language, 'Subscribed', 'مشترك')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300">
                    {copyFor(language, 'Push Not Permitted', 'الإشعارات غير مفعلة')}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {copyFor(
                  language,
                  'Real-time automated push notifications when irrigation zones exceed critical drought stress thresholds.',
                  'إشعارات دفع فورية وتلقائية عند تجاوز مناطق الري لعتبات إجهاد الجفاف الحرجة.'
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {permission !== 'granted' && (
              <Button size="sm" onClick={handleEnablePush} className="h-9 gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white">
                <Bell className="h-3.5 w-3.5" /> {copyFor(language, 'Enable Push Alerts', 'تفعيل إشعارات الدفع')}
              </Button>
            )}
            {highStressCount > 0 && (
              <Button
                size="sm"
                onClick={handleBroadcastAllHighStress}
                className="h-9 gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                <Flame className="h-3.5 w-3.5" />
                {copyFor(language, `Alert All (${highStressCount})`, `تنبيه الكل (${highStressCount})`)}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Global Environmental Parameters */}
      <div className="rounded-xl border bg-card p-3 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            {copyFor(language, 'Active Environmental Sensors & ET₀', 'حساسات البيئة وET₀ النشطة')}
          </div>
          <Badge variant="outline" className="text-[9px] font-mono">
            {copyFor(language, 'Threshold:', 'العتبة:')} {settings.droughtStressThreshold}/100 DSI
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Reference ET₀ (mm/day)', 'البخر-نتح المرجعي ET₀ (ملم/يوم)')}</Label>
            <Input
              type="number"
              step="0.1"
              value={globalEt0}
              onChange={e => setGlobalEt0(e.target.value)}
              className="mt-1 h-9 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Effective Rain (mm)', 'الأمطار الفعالة (ملم)')}</Label>
            <Input
              type="number"
              step="0.1"
              value={globalRain}
              onChange={e => setGlobalRain(e.target.value)}
              className="mt-1 h-9 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Alert Threshold (DSI)', 'عتبة التنبيه (DSI)')}</Label>
            <Input
              type="number"
              min={30}
              max={95}
              value={settings.droughtStressThreshold}
              onChange={e => handleUpdateSettings({ droughtStressThreshold: parseInt(e.target.value) || 65 })}
              className="mt-1 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Zones Drought Status Table / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-600" />
            {copyFor(language, 'Monitored Irrigation Zones', 'مناطق الري المراقبة')} ({zoneCalculations.length})
          </div>
          {highStressCount > 0 && (
            <Badge variant="destructive" className="text-[10px] animate-pulse">
              {highStressCount} {copyFor(language, 'Zones in High Stress', 'مناطق في إجهاد مرتفع')}
            </Badge>
          )}
        </div>

        {zoneCalculations.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={copyFor(language, 'No Zones Configured', 'لا توجد مناطق')}
            description={copyFor(language, 'Add irrigation zones in the Zones tab to enable drought alerting.', 'أضف مناطق ري لتفعيل تنبيهات الجفاف.')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {zoneCalculations.map(calc => (
              <div
                key={calc.zone.id}
                className={`rounded-xl border p-4 transition-all ${
                  calc.isHighStress
                    ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20 shadow-sm'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Zone Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{calc.zone.name}</span>
                      <span className="text-xs text-muted-foreground">({calc.controller.name})</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {calc.zone.crop || 'Tomato'} · {calc.zone.stage || 'vegetative'}
                      </Badge>
                      <Badge className={`text-[10px] border ${calc.badgeColor}`}>
                        {calc.level.toUpperCase()} ({calc.dsiScore}/100)
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground leading-relaxed flex items-center gap-2">
                      <span>{calc.advice}</span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                      <span>
                        {copyFor(language, 'Soil Water:', 'ماء التربة:')}{' '}
                        <strong className="text-foreground">{calc.sw} mm</strong> / {calc.taw} mm ({calc.depletionPct.toFixed(0)}% {copyFor(language, 'depleted', 'مستنزف')})
                      </span>
                      {calc.zone.lastDsiCheck && (
                        <span className="text-[10px] text-muted-foreground">
                          {copyFor(language, 'Last Alert:', 'آخر تنبيه:')}{' '}
                          {new Date(calc.zone.lastDsiCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Adjust & Push Trigger */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[10px] text-muted-foreground">{copyFor(language, 'Soil mm:', 'الماء:')}</Label>
                      <Input
                        type="number"
                        step="5"
                        value={calc.zone.soilWaterMm !== undefined ? calc.zone.soilWaterMm : 40}
                        onChange={e => {
                          onUpdateZone(calc.controller.id, calc.zone.id, {
                            soilWaterMm: Math.max(0, parseFloat(e.target.value) || 0),
                          });
                        }}
                        className="h-8 w-16 text-xs font-mono"
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleTriggerAlert(calc)}
                      disabled={sendingZoneId === calc.zone.id}
                      className={`h-8 text-xs gap-1 ${
                        calc.isHighStress
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                      }`}
                    >
                      {sendingZoneId === calc.zone.id ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{copyFor(language, 'Pushing...', 'جارٍ الإرسال...')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          <span>{copyFor(language, 'Push Alert', 'إرسال تنبيه')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        💡 <strong>{copyFor(language, 'Push Alert Delivery', 'توصيل إشعارات الدفع')}</strong>: {copyFor(language, 'Integrates with OneSignal Web Push to broadcast instant agronomic warnings to field operators, farm managers, and mobile devices when high drought stress is calculated.', 'يتكامل مع إشعارات ويب OneSignal لبث تنبيهات زراعية فورية لمديري المزارع وفرق العمل عند حساب إجهاد جفاف مرتفع.')}
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

