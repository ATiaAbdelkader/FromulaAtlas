'use client';

/**
 * Labor Calendar — week-by-week field operations schedule based on each
 * crop's phenology stages.
 *
 * Uses the crop lifecycle database (@/lib/crop-lifecycle) which encodes
 * FAO-56 + extension-service labor operations for 20 major crops.
 *
 * Output:
 *   - Calendar grid: weeks × operations, color-coded by operation type
 *   - Per-operation cards with date, stage, type, labor-days/ha, skill,
 *     equipment, priority
 *   - Peak labor detection (week with highest demand)
 *   - Total season labor requirement (person-days)
 *   - PDF export (via window.print())
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays, Users, Download, AlertTriangle, CheckCircle2,
  Wrench, Clock, TrendingUp, Activity, MapPin, Briefcase,
} from 'lucide-react';
import {
  CROP_LIFECYCLES, getCropLifecycle, stageForDay, totalLaborDays, peakLaborWeek,
  type CropLifecycle, type LaborOperation, type LaborType,
} from '@/lib/crop-lifecycle';

const LABOR_TYPE_INFO: Record<LaborType, { label: string; color: string; icon: string }> = {
  land_prep:     { label: 'Land Preparation', color: '#92400e', icon: '🚜' },
  planting:      { label: 'Planting',         color: '#166534', icon: '🌱' },
  fertilization: { label: 'Fertilization',    color: '#1e40af', icon: '💧' },
  irrigation:    { label: 'Irrigation',       color: '#0e7490', icon: '💦' },
  pest:          { label: 'Pest Management',  color: '#b91c1c', icon: '🐛' },
  weed:          { label: 'Weed Control',     color: '#a16207', icon: '🌿' },
  pruning:       { label: 'Pruning/Training', color: '#7c2d12', icon: '✂️' },
  harvest:       { label: 'Harvest',          color: '#15803d', icon: '🧺' },
  post_harvest:  { label: 'Post-Harvest',     color: '#7e22ce', icon: '📦' },
  monitoring:    { label: 'Monitoring',       color: '#475569', icon: '🔍' },
};

const PRIORITY_INFO: Record<'critical' | 'recommended' | 'optional', { label: string; color: string }> = {
  critical:    { label: 'Critical',    color: '#dc2626' },
  recommended: { label: 'Recommended', color: '#f59e0b' },
  optional:    { label: 'Optional',    color: '#64748b' },
};

const SKILL_INFO: Record<'basic' | 'trained' | 'specialist', { label: string; color: string }> = {
  basic:      { label: 'Basic',      color: '#16a34a' },
  trained:    { label: 'Trained',    color: '#0891b2' },
  specialist: { label: 'Specialist', color: '#8b5cf6' },
};

export function LaborCalendar() {
  const [cropId, setCropId] = useState<string>('maize');
  const [areaHa, setAreaHa] = useState<number>(1);
  const [plantingDate, setPlantingDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [filterType, setFilterType] = useState<LaborType | 'all'>('all');

  const crop = useMemo<CropLifecycle>(
    () => getCropLifecycle(cropId) ?? CROP_LIFECYCLES[0],
    [cropId],
  );

  // Compute week index for each operation
  const opsWithWeek = useMemo(() => {
    return crop.labor.map(op => ({
      ...op,
      week: Math.floor(op.day / 7) + 1,
      totalLaborDays: op.laborDaysPerHa * areaHa,
      dateOffset: addDays(plantingDate, op.day),
    }));
  }, [crop, areaHa, plantingDate]);

  const totalWeeks = Math.ceil(crop.seasonLength / 7);

  const filtered = useMemo(
    () => filterType === 'all' ? opsWithWeek : opsWithWeek.filter(o => o.type === filterType),
    [opsWithWeek, filterType],
  );

  const stats = useMemo(() => {
    const total = totalLaborDays(crop) * areaHa;
    const peak = peakLaborWeek(crop);
    const byType: Record<string, number> = {};
    for (const op of opsWithWeek) {
      byType[op.type] = (byType[op.type] || 0) + op.totalLaborDays;
    }
    const critical = opsWithWeek.filter(o => o.priority === 'critical').length;
    return { total, peak, byType, critical };
  }, [crop, areaHa, opsWithWeek]);

  // Build week grid for the calendar view
  const weekGrid = useMemo(() => {
    const weeks: { week: number; ops: typeof opsWithWeek }[] = [];
    for (let w = 1; w <= totalWeeks; w++) {
      weeks.push({ week: w, ops: opsWithWeek.filter(o => o.week === w) });
    }
    return weeks;
  }, [opsWithWeek, totalWeeks]);

  const exportPdf = useCallback(() => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Labor Calendar — ${crop.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; color: #1f2937; }
        h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 8px; }
        h2 { color: #155e75; margin-top: 24px; font-size: 14px; text-transform: uppercase; }
        .meta { font-size: 11px; color: #64748b; margin: 4px 0 16px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 11px; }
        th { background: #ecfeff; padding: 6px 8px; text-align: left; border: 1px solid #d1d5db; color: #155e75; }
        td { padding: 6px 8px; border: 1px solid #d1d5db; vertical-align: top; }
        tr:nth-child(even) td { background: #fafafa; }
        .stats { background: #ecfeff; padding: 12px; border-radius: 6px; margin: 12px 0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .stats .stat strong { display: block; font-size: 18px; color: #0891b2; }
        .priority-critical { background: #fee2e2 !important; color: #991b1b; font-weight: bold; }
        .priority-recommended { background: #fef3c7 !important; color: #92400e; }
        @media print { @page { margin: 1cm; } }
      </style></head><body>
      <h1>${crop.emoji} Labor Calendar — ${crop.name}</h1>
      <div class="meta">
        <strong>Field area:</strong> ${areaHa} ha ·
        <strong>Planting date:</strong> ${plantingDate} ·
        <strong>Season length:</strong> ${crop.seasonLength} days (${totalWeeks} weeks) ·
        <strong>Generated:</strong> ${new Date().toLocaleString()}
      </div>
      <p style="font-size: 11px; color: #475569;">${crop.notes}</p>

      <div class="stats">
        <div class="stat"><strong>${stats.total.toFixed(1)}</strong> Total person-days (${areaHa} ha)</div>
        <div class="stat"><strong>Week ${stats.peak.week}</strong> Peak labor demand (${stats.peak.laborDays.toFixed(1)} d)</div>
        <div class="stat"><strong>${stats.critical}</strong> Critical operations</div>
      </div>

      <h2>Operations Schedule</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th><th>Date</th><th>Week</th><th>Stage</th><th>Operation</th><th>Type</th>
            <th>Labor-days</th><th>Skill</th><th>Priority</th><th>Equipment</th><th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${opsWithWeek
            .slice()
            .sort((a, b) => a.day - b.day)
            .map(o => `
            <tr class="priority-${o.priority}">
              <td>${o.day}</td>
              <td>${o.dateOffset}</td>
              <td>${o.week}</td>
              <td>${o.stage}</td>
              <td>${o.task}</td>
              <td>${LABOR_TYPE_INFO[o.type].icon} ${LABOR_TYPE_INFO[o.type].label}</td>
              <td>${o.totalLaborDays.toFixed(1)}</td>
              <td>${o.skill}</td>
              <td>${o.priority}</td>
              <td>${o.equipment || '—'}</td>
              <td>${o.notes || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>By Operation Type</h2>
      <table>
        <thead><tr><th>Type</th><th>Total labor-days</th><th>% of season</th></tr></thead>
        <tbody>
          ${Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, days]) => `
              <tr>
                <td>${LABOR_TYPE_INFO[type as LaborType].icon} ${LABOR_TYPE_INFO[type as LaborType].label}</td>
                <td>${days.toFixed(1)}</td>
                <td>${(days / stats.total * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
        </tbody>
      </table>

      <p style="font-size: 10px; color: #64748b; margin-top: 24px;">
        Generated by Formula Atlas — Labor Calendar. Labor requirements are research-based estimates; adjust for mechanization level + worker skill.
      </p>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [crop, areaHa, plantingDate, opsWithWeek, stats, totalWeeks]);

  return (
    <Card className="overflow-hidden border-cyan-200/60 shadow-sm dark:border-cyan-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-cyan-50 via-background to-sky-50/60 pb-4 dark:from-cyan-950/30 dark:via-background dark:to-sky-950/20">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-cyan-600" /> Labor Calendar
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">Phenology-driven field operations · 20 crops · person-days/ha estimates + peak week detection</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Crop</Label>
            <select
              value={cropId}
              onChange={e => setCropId(e.target.value)}
              aria-label="Crop"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CROP_LIFECYCLES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">Field area (hectares)</Label>
            <Input
              type="number" min={0.1} step={0.1}
              value={areaHa}
              onChange={e => setAreaHa(Math.max(0.1, parseFloat(e.target.value) || 1))}
              aria-label="Field area in hectares"
              className="mt-1 h-10 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Planting date</Label>
            <Input
              type="date"
              value={plantingDate}
              onChange={e => setPlantingDate(e.target.value)}
              aria-label="Planting date"
              className="mt-1 h-10 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Filter by type</Label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as LaborType | 'all')}
              aria-label="Filter operations by type"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All operations ({opsWithWeek.length})</option>
              {(Object.keys(LABOR_TYPE_INFO) as LaborType[]).map(t => (
                <option key={t} value={t}>{LABOR_TYPE_INFO[t].icon} {LABOR_TYPE_INFO[t].label} ({opsWithWeek.filter(o => o.type === t).length})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatCard icon={Users} color="cyan" label="Total labor" value={`${stats.total.toFixed(1)} d`} sub={`${areaHa} ha`} />
          <StatCard icon={TrendingUp} color="amber" label="Peak week" value={`Wk ${stats.peak.week}`} sub={`${stats.peak.laborDays.toFixed(1)} d`} />
          <StatCard icon={AlertTriangle} color="rose" label="Critical ops" value={String(stats.critical)} sub={`${stats.total > 0 ? ((stats.critical / opsWithWeek.length) * 100).toFixed(0) : 0}% of total`} />
        </div>

        {/* Peak week warning */}
        {stats.peak.laborDays > 5 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div>
              <strong>Peak labor bottleneck in week {stats.peak.week}.</strong> {stats.peak.laborDays.toFixed(1)} person-days needed — consider hiring temp workers, mechanizing, or staggering plantings.
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <CalendarGrid weekGrid={weekGrid} totalWeeks={totalWeeks} />

        {/* Operations list */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Briefcase className="h-3 w-3" /> Operations ({filtered.length})
          </div>
          {filtered
            .slice()
            .sort((a, b) => a.day - b.day)
            .map((op, i) => {
              const stage = stageForDay(crop, Math.max(1, op.day));
              const typeInfo = LABOR_TYPE_INFO[op.type];
              const priorityInfo = PRIORITY_INFO[op.priority];
              const skillInfo = SKILL_INFO[op.skill];
              return (
                <div key={i} className="rounded-xl border bg-background p-3 shadow-sm transition-colors hover:bg-muted/20" style={{ borderLeftWidth: 4, borderLeftColor: typeInfo.color }}>
                  <div className="flex items-start justify-between flex-wrap gap-1 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-mono">D{op.day}</Badge>
                      <span className="text-[10px] text-muted-foreground">{op.dateOffset}</span>
                      {stage && <span className="text-[10px]">{stage.emoji} {stage.name}</span>}
                      <Badge variant="outline" className="text-[9px]" style={{ color: typeInfo.color, borderColor: typeInfo.color + '60' }}>
                        {typeInfo.icon} {typeInfo.label}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-[9px]" style={{ color: priorityInfo.color, borderColor: priorityInfo.color + '60' }}>
                      {priorityInfo.label}
                    </Badge>
                  </div>
                  <div className="text-xs font-medium mb-1.5">{op.task}</div>
                  <div className="grid grid-cols-1 gap-2 text-xs mb-2 sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">Labor: </span>
                      <strong className="font-mono">{op.totalLaborDays.toFixed(1)} d</strong>
                      <span className="text-muted-foreground"> ({op.durationDays}-day window)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Skill: </span>
                      <span style={{ color: skillInfo.color }} className="font-medium">{skillInfo.label}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Equipment: </span>
                      <span>{op.equipment || 'Hand tools'}</span>
                    </div>
                  </div>
                  {op.notes && (
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 italic flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{op.notes}</span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* By-type breakdown */}
        <div className="rounded-xl border bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-cyan-600" />
            Labor by operation type
          </div>
          <div className="space-y-1">
            {Object.entries(stats.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, days]) => {
                const info = LABOR_TYPE_INFO[type as LaborType];
                const pct = stats.total > 0 ? (days / stats.total) * 100 : 0;
                return (
                  <div key={type} className="flex items-center gap-2 text-[10px]">
                    <span className="w-32 truncate" style={{ color: info.color }}>{info.icon} {info.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                    </div>
                    <span className="w-16 text-right font-mono">{days.toFixed(1)} d</span>
                    <span className="w-10 text-right text-muted-foreground">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Export */}
        <Button size="sm" onClick={exportPdf} className="h-11 w-full gap-2">
          <Download className="h-3.5 w-3.5" /> Export labor calendar (PDF)
        </Button>

        <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
          💡 Labor requirements assume smallholder-to-medium mechanization. Highly mechanized farms should reduce estimates by 40–70%. Stagger plantings 1–2 weeks apart to spread peak labor demand.
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Calendar grid SVG
// ============================================================================

function CalendarGrid({ weekGrid, totalWeeks }: { weekGrid: { week: number; ops: any[] }[]; totalWeeks: number }) {
  const cellW = 320 / Math.min(totalWeeks, 26);  // cap at 26 weeks visible
  const rowH = 14;

  // Group ops by type for stacking
  const typeRows: LaborType[] = ['land_prep', 'planting', 'fertilization', 'irrigation', 'weed', 'pest', 'pruning', 'monitoring', 'harvest', 'post_harvest'];

  const W = 320;
  const H = typeRows.length * rowH + 16;
  const pad = 22;

  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-cyan-600" />
        Weekly calendar
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Labor calendar">
        {/* Type row labels */}
        {typeRows.map((t, i) => (
          <text key={t} x={2} y={pad + i * rowH + 8} fontSize="6" className="fill-muted-foreground">
            {LABOR_TYPE_INFO[t].icon}
          </text>
        ))}
        {/* Week columns */}
        {weekGrid.slice(0, 26).map((wk, idx) => {
          const x = pad + idx * cellW;
          return (
            <g key={wk.week}>
              {/* Week number on top */}
              {(idx % 4 === 0 || idx === weekGrid.length - 1) && (
                <text x={x + cellW / 2} y={8} fontSize="6" textAnchor="middle" className="fill-muted-foreground font-mono">
                  W{wk.week}
                </text>
              )}
              {/* Vertical grid line */}
              <line x1={x + cellW / 2} y1={pad - 2} x2={x + cellW / 2} y2={H - 4}
                stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground/20" />
              {/* Operation cells */}
              {wk.ops.map((op, i) => {
                const rowIdx = typeRows.indexOf(op.type);
                if (rowIdx < 0) return null;
                const color = LABOR_TYPE_INFO[op.type as LaborType].color;
                const intensity = Math.min(1, op.laborDaysPerHa / 5);
                return (
                  <rect
                    key={`${op.day}-${i}`}
                    x={x + 0.5}
                    y={pad + rowIdx * rowH + 1}
                    width={cellW - 1}
                    height={rowH - 2}
                    fill={color}
                    opacity={0.4 + intensity * 0.6}
                    rx={1}
                  >
                    <title>D{op.day} · {op.task} ({op.laborDaysPerHa} d/ha)</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  rose: 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20',
  indigo: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20',
};

function StatCard({ icon: Icon, color, label, value, sub }: {
  icon: typeof Users; color: keyof typeof ACCENT_BG; label: string; value: string; sub?: string;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 shadow-sm ${ACCENT_BG[color]}`}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-2.5 w-2.5" />{label}
      </div>
      <div className="font-mono text-base font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
