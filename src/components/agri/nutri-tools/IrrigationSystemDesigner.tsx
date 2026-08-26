'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings, Droplets, Plus, Trash2, Download, Gauge, Sun, Trees,
  Activity, Zap,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  NOZZLES, ARC_ANGLES, getNozzle, recommendValve, recommendPipeSize,
  PLANT_WATER_NEEDS, DRIP_DEFAULTS, sizePump,
  precipitationRate,
  gpmToLpm, psiToBar, psiToKpa, hpToKw,
} from '@/lib/irrigation-design-data';

type ZoneType = 'sprinkler' | 'drip' | 'bubbler';

interface SprinklerRow {
  id: string;
  code: string;
  arc: number;
  count: number;
  spacing_ft: number;
}

interface DripState {
  lineLength_ft: number;
  emitterSpacing_inch: number;
  flowPerEmitter_gph: number;
  area_ft2: number;
}

interface BubblerRow {
  id: string;
  plantType: string;
  count: number;
  runMinutes: number;
}

interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  sprinklers: SprinklerRow[];
  drip: DripState;
  bubblers: BubblerRow[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_DRIP: DripState = {
  lineLength_ft: DRIP_DEFAULTS.lineLength_ft,
  emitterSpacing_inch: DRIP_DEFAULTS.emitterSpacing_inch,
  flowPerEmitter_gph: DRIP_DEFAULTS.flowPerEmitter_gph,
  area_ft2: 100,
};

// --------------------------------------------------------------------
// Zone-level calculations
// --------------------------------------------------------------------
function sprinklerZoneGpm(rows: SprinklerRow[]): number {
  return rows.reduce((sum, r) => {
    const n = getNozzle(r.code);
    if (!n) return sum;
    return sum + (n.flows[r.arc] || 0) * (r.count || 0);
  }, 0);
}

function sprinklerZoneArea(rows: SprinklerRow[]): number {
  // rectangular grid approximation: area = spacing² × heads (square spacing)
  return rows.reduce((sum, r) => sum + Math.pow(r.spacing_ft || 0, 2) * (r.count || 0), 0);
}

function dripZoneCalc(d: DripState) {
  const lineFt = Math.max(0, d.lineLength_ft);
  const spacingIn = Math.max(1, d.emitterSpacing_inch);
  const spacingFt = spacingIn / 12;
  const emitters = Math.floor(lineFt / spacingFt);
  const totalGph = emitters * Math.max(0, d.flowPerEmitter_gph);
  const totalGpm = totalGph / 60;
  const area = Math.max(0, d.area_ft2);
  const pr = precipitationRate(totalGpm, area);
  return { emitters, totalGph, totalGpm, pr };
}

function bubblerZoneCalc(rows: BubblerRow[]) {
  // gallons per week (plant demand) → GPM (delivered in runMinutes per week)
  let totalGal = 0;
  rows.forEach(r => {
    const need = PLANT_WATER_NEEDS[r.plantType] || 0;
    totalGal += need * (r.count || 0);
  });
  // Use min(runMinutes) → worst case; otherwise weighted average
  const avgMin = rows.length
    ? rows.reduce((s, r) => s + Math.max(1, r.runMinutes), 0) / rows.length
    : 1;
  const gpm = avgMin > 0 ? totalGal / avgMin : 0;
  return { totalGal, gpm };
}

function zoneGpm(z: Zone): number {
  if (z.type === 'sprinkler') return sprinklerZoneGpm(z.sprinklers);
  if (z.type === 'drip')      return dripZoneCalc(z.drip).totalGpm;
  return bubblerZoneCalc(z.bubblers).gpm;
}

// --------------------------------------------------------------------
// Sample zones
// --------------------------------------------------------------------
function sampleZones(): Zone[] {
  return [
    {
      id: uid(),
      name: 'Lawn — North',
      type: 'sprinkler',
      sprinklers: [
        { id: uid(), code: '10A', arc: 90,  count: 6, spacing_ft: 10 },
        { id: uid(), code: '12A', arc: 180, count: 4, spacing_ft: 12 },
      ],
      drip: { ...DEFAULT_DRIP },
      bubblers: [],
    },
    {
      id: uid(),
      name: 'Orchard — Drip',
      type: 'drip',
      sprinklers: [],
      drip: { lineLength_ft: 240, emitterSpacing_inch: 24, flowPerEmitter_gph: 1, area_ft2: 600 },
      bubblers: [],
    },
    {
      id: uid(),
      name: 'Trees — Bubbler',
      type: 'bubbler',
      sprinklers: [],
      drip: { ...DEFAULT_DRIP },
      bubblers: [
        { id: uid(), plantType: 'Large Tree', count: 4, runMinutes: 30 },
        { id: uid(), plantType: 'Palm Tree',  count: 6, runMinutes: 25 },
      ],
    },
  ];
}

const ZONE_BADGES: Record<ZoneType, { label: string; cls: string }> = {
  sprinkler: { label: 'Sprinkler', cls: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300' },
  drip:      { label: 'Drip',      cls: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' },
  bubbler:   { label: 'Bubbler',   cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' },
};

const ZONE_TYPE_AR: Record<ZoneType, string> = { sprinkler: 'رشاش', drip: 'تنقيط', bubbler: 'فقاعي' };
const ZONE_NAME_AR: Record<string, string> = { 'Lawn — North': 'العشب — الشمال', 'Orchard — Drip': 'البستان — تنقيط', 'Trees — Bubbler': 'الأشجار — فقاعي' };
const PLANT_NAME_AR: Record<string, string> = {
  'Small Shrubs': 'شجيرات صغيرة', 'Large Shrubs': 'شجيرات كبيرة', 'Small Tree': 'شجرة صغيرة', 'Large Tree': 'شجرة كبيرة',
  'Palm Tree': 'نخلة', Evergreen: 'شجرة دائمة الخضرة', 'Ground Cover': 'غطاء أرضي', 'Bedding Plants': 'نباتات أحواض',
  'Container Small': 'حاوية صغيرة', 'Container Large': 'حاوية كبيرة',
};
const STAT_LABEL_AR: Record<string, string> = {
  Zones: 'المناطق', 'Total flow': 'التدفق الكلي', 'Max zone': 'أقصى منطقة', 'Pump power': 'قدرة المضخة',
  'Total head': 'الرفع الكلي', Pressure: 'الضغط', 'Pump flow': 'تدفق المضخة', Power: 'القدرة', Emitters: 'النقاطات', 'Precip. rate': 'معدل الهطول',
};
const localizeZoneName = (name: string, language: Parameters<typeof copyFor>[0]) => copyFor(language, name, ZONE_NAME_AR[name] ?? name);

// ====================================================================
export function IrrigationSystemDesigner() {
  const { language } = useTranslation();
  const [zones, setZones] = useState<Zone[]>(sampleZones);
  const [pumpInput, setPumpInput] = useState({
    maxStationFlow_gpm: '0',
    staticHead_m: '15',
    maxDistance_m: '120',
    numberOfDutyPumps: '1',
    numberOfStandbyPumps: '1',
  });

  const zoneFlows = zones.map(zoneGpm);
  const totalFlow = zoneFlows.reduce((a, b) => a + b, 0);
  const maxZoneFlow = zoneFlows.length ? Math.max(...zoneFlows) : 0;
  const pumpResult = useMemo(() => {
    return sizePump({
      maxStationFlow_gpm: parseFloat(pumpInput.maxStationFlow_gpm) || maxZoneFlow,
      staticHead_m: parseFloat(pumpInput.staticHead_m) || 0,
      maxDistance_m: parseFloat(pumpInput.maxDistance_m) || 0,
      numberOfDutyPumps: parseInt(pumpInput.numberOfDutyPumps) || 1,
      numberOfStandbyPumps: parseInt(pumpInput.numberOfStandbyPumps) || 0,
    });
  }, [pumpInput, maxZoneFlow]);

  // Mutators ---------------------------------------------------------
  const addZone = (type: ZoneType) => {
    setZones(prev => [...prev, {
      id: uid(),
      name: `${type[0].toUpperCase()}${type.slice(1)} Zone ${prev.length + 1}`,
      type,
      sprinklers: type === 'sprinkler' ? [{ id: uid(), code: '8A', arc: 180, count: 4, spacing_ft: 8 }] : [],
      drip: type === 'drip' ? { ...DEFAULT_DRIP } : { ...DEFAULT_DRIP },
      bubblers: type === 'bubbler' ? [{ id: uid(), plantType: 'Small Tree', count: 2, runMinutes: 20 }] : [],
    }]);
  };
  const removeZone = (id: string) => setZones(prev => prev.filter(z => z.id !== id));
  const updateZone = (id: string, patch: Partial<Zone>) =>
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...patch } : z));

  const updateSprinkler = (zid: string, rid: string, patch: Partial<SprinklerRow>) =>
    setZones(prev => prev.map(z => z.id === zid ? {
      ...z, sprinklers: z.sprinklers.map(r => r.id === rid ? { ...r, ...patch } : r),
    } : z));
  const addSprinkler = (zid: string) =>
    setZones(prev => prev.map(z => z.id === zid ? {
      ...z, sprinklers: [...z.sprinklers, { id: uid(), code: '8A', arc: 180, count: 1, spacing_ft: 8 }],
    } : z));
  const removeSprinkler = (zid: string, rid: string) =>
    setZones(prev => prev.map(z => z.id === zid ? {
      ...z, sprinklers: z.sprinklers.filter(r => r.id !== rid),
    } : z));

  const updateBubbler = (zid: string, rid: string, patch: Partial<BubblerRow>) =>
    setZones(prev => prev.map(z => z.id === zid ? {
      ...z, bubblers: z.bubblers.map(r => r.id === rid ? { ...r, ...patch } : r),
    } : z));
  const addBubbler = (zid: string) =>
    setZones(prev => prev.map(z => z.id === zid ? {
      ...z, bubblers: [...z.bubblers, { id: uid(), plantType: 'Small Tree', count: 1, runMinutes: 20 }],
    } : z));
  const removeBubbler = (zid: string, rid: string) =>
    setZones(prev => prev.map(z => z.id === zid ? {
      ...z, bubblers: z.bubblers.filter(r => r.id !== rid),
    } : z));

  // PDF export -------------------------------------------------------
  const handleExport = () => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const zoneRows = zones.map((z, i) => {
      const gpm = zoneFlows[i].toFixed(2);
      if (z.type === 'sprinkler') {
        const area = sprinklerZoneArea(z.sprinklers);
        const pr = precipitationRate(zoneFlows[i], area).toFixed(2);
        const valve = recommendValve(zoneFlows[i]);
        const pipe = recommendPipeSize(zoneFlows[i]);
        return `<tr><td>${localizeZoneName(z.name, language)}</td><td>${copyFor(language, 'Sprinkler', 'رشاش')}</td><td>${z.sprinklers.length}</td><td>${gpm}</td><td>${pr}</td><td>${valve.model} ${valve.size}</td><td>${pipe}</td></tr>`;
      }
      if (z.type === 'drip') {
        const d = dripZoneCalc(z.drip);
        return `<tr><td>${localizeZoneName(z.name, language)}</td><td>${copyFor(language, 'Drip', 'تنقيط')}</td><td>${d.emitters}</td><td>${gpm}</td><td>${d.pr.toFixed(2)}</td><td>${recommendValve(zoneFlows[i]).model}</td><td>${recommendPipeSize(zoneFlows[i])}</td></tr>`;
      }
      const b = bubblerZoneCalc(z.bubblers);
      return `<tr><td>${localizeZoneName(z.name, language)}</td><td>${copyFor(language, 'Bubbler', 'فقاعي')}</td><td>${z.bubblers.reduce((s, r) => s + r.count, 0)}</td><td>${gpm}</td><td>—</td><td>${recommendValve(zoneFlows[i]).model}</td><td>${recommendPipeSize(zoneFlows[i])}</td></tr>`;
    }).join('');
    w.document.write(`<!doctype html><html><head><title>${copyFor(language, 'Irrigation System Design', 'تصميم نظام الري')}</title>
<style>body{font-family:system-ui;padding:24px;color:#0f172a}h1{color:#4338ca;margin:0 0 4px}
.stat{display:inline-block;padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;margin:4px 4px 0 0;min-width:120px}
.stat .l{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
.stat .v{font-size:18px;font-weight:700;color:#4338ca}
table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;text-align:left}
h3{color:#4338ca;margin-top:18px}</style></head><body>
<h1>${copyFor(language, 'Irrigation System Design', 'تصميم نظام الري')}</h1>
<p style="font-size:11px;color:#64748b;margin:0 0 8px">${copyFor(language, 'Generated', 'تم الإنشاء')} ${new Date().toLocaleString(language === 'ar' ? 'ar-EG' : undefined)}</p>
<div>
<div class="stat"><div class="l">${copyFor(language, 'Zones', 'المناطق')}</div><div class="v">${zones.length}</div></div>
<div class="stat"><div class="l">${copyFor(language, 'Total flow', 'التدفق الكلي')}</div><div class="v">${totalFlow.toFixed(2)} GPM</div></div>
<div class="stat"><div class="l">${copyFor(language, 'Max zone', 'أقصى منطقة')}</div><div class="v">${maxZoneFlow.toFixed(2)} GPM</div></div>
<div class="stat"><div class="l">${copyFor(language, 'Pump power', 'قدرة المضخة')}</div><div class="v">${pumpResult.pumpPower_hp.toFixed(2)} HP</div></div>
</div>
<h3>${copyFor(language, 'Zones', 'المناطق')}</h3>
<table><thead><tr><th>${copyFor(language, 'Name', 'الاسم')}</th><th>${copyFor(language, 'Type', 'النوع')}</th><th>${copyFor(language, 'Heads/Emitters', 'الرشاشات/النقاطات')}</th><th>GPM</th><th>${copyFor(language, 'Precip. (in/h)', 'الهطول (بوصة/ساعة)')}</th><th>${copyFor(language, 'Valve', 'الصمام')}</th><th>${copyFor(language, 'Pipe', 'الأنبوب')}</th></tr></thead><tbody>${zoneRows}</tbody></table>
<h3>${copyFor(language, 'Pump sizing', 'تحديد حجم المضخة')}</h3>
<table>
<tr><td>${copyFor(language, 'Total head', 'الرفع الكلي')}</td><td>${pumpResult.totalHead_m.toFixed(2)} m</td></tr>
<tr><td>${copyFor(language, 'Pressure', 'الضغط')}</td><td>${pumpResult.pressure_psi.toFixed(1)} psi (${psiToBar(pumpResult.pressure_psi).toFixed(2)} bar)</td></tr>
<tr><td>${copyFor(language, 'Flow per pump', 'التدفق لكل مضخة')}</td><td>${pumpResult.pumpFlow_gpm.toFixed(2)} GPM</td></tr>
<tr><td>${copyFor(language, 'Power', 'القدرة')}</td><td>${pumpResult.pumpPower_hp.toFixed(2)} HP (${hpToKw(pumpResult.pumpPower_hp).toFixed(2)} kW)</td></tr>
</table>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  // Render -----------------------------------------------------------
  return (
    <Card className="overflow-hidden border-indigo-100 shadow-sm dark:border-indigo-900/60">
      <CardHeader className="border-b border-border/60 bg-indigo-50/50 pb-4 dark:bg-indigo-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"><Settings className="h-4 w-4" /></span> {copyFor(language, 'Irrigation System Designer', 'مصمم نظام الري')}</CardTitle>
        <CardDescription className="mt-1 text-xs leading-relaxed">{copyFor(language, 'Multi-zone sprinkler / drip / bubbler designer with valve &amp; pipe sizing, pump selection, and PDF export.', 'مصمم متعدد المناطق للرش والتنقيط والري الفقاعي مع تحديد حجم الصمامات والأنابيب، واختيار المضخة، وتصدير PDF.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            { icon: Settings,    label: copyFor(language, 'Zones', 'المناطق'),      value: String(zones.length),                                   unit: '',    color: 'text-indigo-700 dark:text-indigo-300' },
            { icon: Droplets,    label: copyFor(language, 'Total flow', 'التدفق الكلي'), value: totalFlow.toFixed(2),                                   unit: 'GPM', color: 'text-emerald-700 dark:text-emerald-300' },
            { icon: Gauge,       label: copyFor(language, 'Max zone', 'أقصى منطقة'),   value: maxZoneFlow.toFixed(2),                                 unit: 'GPM', color: 'text-sky-700 dark:text-sky-300' },
            { icon: Zap,         label: copyFor(language, 'Pump power', 'قدرة المضخة'), value: pumpResult.pumpPower_hp.toFixed(2),                     unit: 'HP',  color: 'text-amber-700 dark:text-amber-300' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-indigo-200/70 bg-indigo-50/30 p-3 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <s.icon className="h-3 w-3" /> {s.label}
              </div>
              <div className={`mt-1 text-xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{copyFor(language, s.unit, s.unit)}</div>
            </div>
          ))}
        </div>

        {/* Add-zone buttons */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="mb-2"><p className="text-xs font-semibold">{copyFor(language, 'Build your zones', 'أنشئ مناطقك')}</p><p className="text-[11px] leading-relaxed text-muted-foreground">{copyFor(language, 'Add one zone per valve or irrigation method, then size the pump from the highest-flow station.', 'أضف منطقة لكل صمام أو طريقة ري، ثم حدّد حجم المضخة وفقاً لأعلى محطة تدفقاً.')}</p></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button size="sm" variant="outline" onClick={() => addZone('sprinkler')} className="h-10"><Plus className="mr-1 h-3.5 w-3.5" />{copyFor(language, 'Sprinkler zone', 'منطقة رشاش')}</Button>
            <Button size="sm" variant="outline" onClick={() => addZone('drip')} className="h-10"><Plus className="mr-1 h-3.5 w-3.5" />{copyFor(language, 'Drip zone', 'منطقة تنقيط')}</Button>
            <Button size="sm" variant="outline" onClick={() => addZone('bubbler')} className="h-10"><Plus className="mr-1 h-3.5 w-3.5" />{copyFor(language, 'Bubbler zone', 'منطقة فقاعية')}</Button>
          </div>
        </div>

        {/* Zone cards */}
        <div className="space-y-3">
          {zones.map((z, zi) => {
            const gpm = zoneFlows[zi];
            const valve = recommendValve(gpm);
            const pipe = recommendPipeSize(gpm);
            return (
              <div key={z.id} className="space-y-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Input aria-label={`${copyFor(language, ZONE_BADGES[z.type].label, ZONE_TYPE_AR[z.type])} ${copyFor(language, 'zone name', 'اسم المنطقة')}`} value={z.name} onChange={e => updateZone(z.id, { name: e.target.value })}
                    className="h-10 min-w-[160px] flex-1 text-sm font-semibold" />
                  <Badge variant="outline" className={ZONE_BADGES[z.type].cls}>{copyFor(language, ZONE_BADGES[z.type].label, ZONE_TYPE_AR[z.type])}</Badge>
                  <Badge variant="secondary" className="font-mono text-xs">{gpm.toFixed(2)} GPM</Badge>
                  <Button size="sm" variant="ghost" aria-label={`${copyFor(language, 'Remove', 'إزالة')} ${z.name}`} onClick={() => removeZone(z.id)} className="h-10 w-10 px-0 text-red-600 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Per-type editor */}
                {z.type === 'sprinkler' && (
                  <SprinklerEditor zone={z}
                    onAdd={() => addSprinkler(z.id)}
                    onUpdate={(rid, p) => updateSprinkler(z.id, rid, p)}
                    onRemove={(rid) => removeSprinkler(z.id, rid)} />
                )}
                {z.type === 'drip' && (
                  <DripEditor zone={z} onUpdate={(p) => updateZone(z.id, { drip: { ...z.drip, ...p } })} />
                )}
                {z.type === 'bubbler' && (
                  <BubblerEditor zone={z}
                    onAdd={() => addBubbler(z.id)}
                    onUpdate={(rid, p) => updateBubbler(z.id, rid, p)}
                    onRemove={(rid) => removeBubbler(z.id, rid)} />
                )}

                {/* Recommendation footer */}
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[11px]">
                  <Badge variant="outline" className="gap-1"><Gauge className="h-3 w-3" />{copyFor(language, 'Valve', 'الصمام')}: {valve.model} {valve.size}</Badge>
                  <Badge variant="outline" className="gap-1"><Activity className="h-3 w-3" />{copyFor(language, 'Pipe', 'الأنبوب')}: {pipe}</Badge>
                  {z.type === 'sprinkler' && (() => {
                    const area = sprinklerZoneArea(z.sprinklers);
                    const pr = precipitationRate(gpm, area);
                    return <Badge variant="outline" className="gap-1"><Sun className="h-3 w-3" />{copyFor(language, 'PR', 'معدل')}: {pr.toFixed(2)} in/h</Badge>;
                  })()}
                  {z.type === 'drip' && (() => {
                    const d = dripZoneCalc(z.drip);
                    return <Badge variant="outline" className="gap-1"><Sun className="h-3 w-3" />{copyFor(language, 'PR', 'معدل')}: {d.pr.toFixed(2)} in/h · {d.emitters} {copyFor(language, 'emitters', 'نقاطات')}</Badge>;
                  })()}
                  {z.type === 'bubbler' && (() => {
                    const b = bubblerZoneCalc(z.bubblers);
                    return <Badge variant="outline" className="gap-1"><Trees className="h-3 w-3" />{b.totalGal.toFixed(1)} {copyFor(language, 'gal/wk', 'غالون/أسبوع')}</Badge>;
                  })()}
                </div>
              </div>
            );
          })}
          {zones.length === 0 && (
            <div className="rounded-xl border-2 border-dashed py-8 text-center text-xs text-muted-foreground">
              {copyFor(language, 'No zones yet — add a sprinkler, drip, or bubbler zone above.', 'لا توجد مناطق بعد — أضف منطقة رشاش أو تنقيط أو ري فقاعي أعلاه.')}
            </div>
          )}
        </div>

        {/* Pump sizing panel */}
        <div className="space-y-3 rounded-xl border border-indigo-200/70 bg-indigo-50/30 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
          <div><div className="flex items-center gap-1.5 text-sm font-semibold"><Zap className="h-4 w-4 text-indigo-600" />{copyFor(language, 'Pump sizing', 'تحديد حجم المضخة')}</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{copyFor(language, 'Use the highest station flow and site head assumptions to size the pump and pressure requirement.', 'استخدم أعلى تدفق للمحطة وافتراضات الرفع في الموقع لتحديد حجم المضخة ومتطلبات الضغط.')}</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Max station flow (GPM)', 'أقصى تدفق للمحطة (GPM)')}</Label>
              <Input type="number" value={pumpInput.maxStationFlow_gpm}
                placeholder={`${copyFor(language, 'auto', 'تلقائي')} = ${maxZoneFlow.toFixed(2)}`}
                onChange={e => setPumpInput(p => ({ ...p, maxStationFlow_gpm: e.target.value }))} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Static head (m)', 'الرفع الساكن (م)')}</Label>
              <Input type="number" value={pumpInput.staticHead_m}
                onChange={e => setPumpInput(p => ({ ...p, staticHead_m: e.target.value }))} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Max distance (m)', 'أقصى مسافة (م)')}</Label>
              <Input type="number" value={pumpInput.maxDistance_m}
                onChange={e => setPumpInput(p => ({ ...p, maxDistance_m: e.target.value }))} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Duty pumps', 'مضخات التشغيل')}</Label>
              <Input type="number" min="1" value={pumpInput.numberOfDutyPumps}
                onChange={e => setPumpInput(p => ({ ...p, numberOfDutyPumps: e.target.value }))} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Standby pumps', 'المضخات الاحتياطية')}</Label>
              <Input type="number" min="0" value={pumpInput.numberOfStandbyPumps}
                onChange={e => setPumpInput(p => ({ ...p, numberOfStandbyPumps: e.target.value }))} className="mt-1 h-10 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <Stat label="Total head" value={`${pumpResult.totalHead_m.toFixed(2)} m`} />
            <Stat label="Pressure" value={`${pumpResult.pressure_psi.toFixed(1)} psi`} sub={`${psiToBar(pumpResult.pressure_psi).toFixed(2)} bar · ${psiToKpa(pumpResult.pressure_psi).toFixed(0)} kPa`} />
            <Stat label="Pump flow" value={`${pumpResult.pumpFlow_gpm.toFixed(2)} GPM`} sub={`${gpmToLpm(pumpResult.pumpFlow_gpm).toFixed(1)} L/min`} />
            <Stat label="Power" value={`${pumpResult.pumpPower_hp.toFixed(2)} HP`} sub={`${hpToKw(pumpResult.pumpPower_hp).toFixed(2)} kW`} />
          </div>
        </div>

        <Button onClick={handleExport} variant="outline" size="sm" className="h-10 w-full">
          <Download className="h-4 w-4 mr-1" /> {copyFor(language, 'Export Design to PDF', 'تصدير التصميم إلى PDF')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ====================================================================
// Sub-components
// ====================================================================
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const { language } = useTranslation();
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, label, STAT_LABEL_AR[label] ?? label)}</div>
      <div className="mt-1 text-sm font-bold text-indigo-700 dark:text-indigo-300">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SprinklerEditor({ zone, onAdd, onUpdate, onRemove }: {
  zone: Zone;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<SprinklerRow>) => void;
  onRemove: (id: string) => void;
}) {
  const { language } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{copyFor(language, 'Nozzle selections', 'اختيارات الفوهات')}</span>
        <Button size="sm" variant="ghost" className="h-9 px-3 text-xs" onClick={onAdd}><Plus className="mr-1 h-3 w-3" />{copyFor(language, 'Add', 'إضافة')}</Button>
      </div>
      <div className="space-y-1.5">
        {zone.sprinklers.map(r => {
          const n = getNozzle(r.code);
          const flowPer = n?.flows[r.arc] || 0;
          return (
            <div key={r.id} className="grid grid-cols-12 gap-1.5 items-center text-xs">
              <div className="col-span-3">
                <Select value={r.code} onValueChange={v => onUpdate(r.id, { code: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOZZLES.map(nn => <SelectItem key={nn.code} value={nn.code} className="text-xs">{nn.code} ({nn.radius_ft}&apos;)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Select value={String(r.arc)} onValueChange={v => onUpdate(r.id, { arc: parseInt(v) })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ARC_ANGLES.map(a => <SelectItem key={a} value={String(a)} className="text-xs">{a}°</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" min="0" value={r.count} onChange={e => onUpdate(r.id, { count: parseInt(e.target.value) || 0 })} className="col-span-2 h-7 text-xs" title={copyFor(language, 'Count', 'العدد')} />
              <Input type="number" min="0" value={r.spacing_ft} onChange={e => onUpdate(r.id, { spacing_ft: parseFloat(e.target.value) || 0 })} className="col-span-2 h-7 text-xs" title={copyFor(language, 'Spacing ft', 'التباعد بالقدم')} />
              <div className="col-span-2 text-right text-[10px] text-muted-foreground">{flowPer.toFixed(2)} × {r.count} = <span className="font-semibold text-emerald-700 dark:text-emerald-300">{(flowPer * r.count).toFixed(2)}</span></div>
              <Button size="sm" variant="ghost" className="col-span-1 h-7 px-0 text-red-600" onClick={() => onRemove(r.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-muted-foreground">{copyFor(language, 'Nozzle · Arc · Count · Spacing(ft) · GPM', 'الفوهة · القوس · العدد · التباعد (قدم) · GPM')}</div>
    </div>
  );
}

function DripEditor({ zone, onUpdate }: { zone: Zone; onUpdate: (p: Partial<DripState>) => void }) {
  const { language } = useTranslation();
  const d = zone.drip;
  const calc = dripZoneCalc(d);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Line length (ft)', 'طول الخط (قدم)')}</Label>
          <Input type="number" value={d.lineLength_ft} onChange={e => onUpdate({ lineLength_ft: parseFloat(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Emitter spacing (in)', 'تباعد النقاطات (بوصة)')}</Label>
          <Input type="number" value={d.emitterSpacing_inch} onChange={e => onUpdate({ emitterSpacing_inch: parseFloat(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Flow/emitter (gph)', 'تدفق/نقاط (غالون/ساعة)')}</Label>
          <Input type="number" value={d.flowPerEmitter_gph} onChange={e => onUpdate({ flowPerEmitter_gph: parseFloat(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Area (ft²)', 'المساحة (قدم²)')}</Label>
          <Input type="number" value={d.area_ft2} onChange={e => onUpdate({ area_ft2: parseFloat(e.target.value) || 0 })} className="h-8 mt-1 text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Emitters" value={String(calc.emitters)} />
        <Stat label="Total flow" value={`${calc.totalGpm.toFixed(2)} GPM`} sub={`${calc.totalGph.toFixed(0)} gph`} />
        <Stat label="Precip. rate" value={`${calc.pr.toFixed(2)} in/h`} />
      </div>
    </div>
  );
}

function BubblerEditor({ zone, onAdd, onUpdate, onRemove }: {
  zone: Zone;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<BubblerRow>) => void;
  onRemove: (id: string) => void;
}) {
  const { language } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{copyFor(language, 'Plant selections', 'اختيارات النباتات')}</span>
        <Button size="sm" variant="ghost" className="h-9 px-3 text-xs" onClick={onAdd}><Plus className="mr-1 h-3 w-3" />{copyFor(language, 'Add', 'إضافة')}</Button>
      </div>
      <div className="space-y-1.5">
        {zone.bubblers.map(r => {
          const need = PLANT_WATER_NEEDS[r.plantType] || 0;
          return (
            <div key={r.id} className="grid grid-cols-12 gap-1.5 items-center text-xs">
              <div className="col-span-5">
                <Select value={r.plantType} onValueChange={v => onUpdate(r.id, { plantType: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(PLANT_WATER_NEEDS).map(p => <SelectItem key={p} value={p} className="text-xs">{copyFor(language, p, PLANT_NAME_AR[p] ?? p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" min="0" value={r.count} onChange={e => onUpdate(r.id, { count: parseInt(e.target.value) || 0 })} className="col-span-2 h-7 text-xs" title={copyFor(language, 'Count', 'العدد')} />
              <Input type="number" min="1" value={r.runMinutes} onChange={e => onUpdate(r.id, { runMinutes: parseInt(e.target.value) || 1 })} className="col-span-2 h-7 text-xs" title={copyFor(language, 'Run min/wk', 'دقائق التشغيل/أسبوع')} />
              <div className="col-span-2 text-right text-[10px] text-muted-foreground">{need} × {r.count} = <span className="font-semibold text-amber-700 dark:text-amber-300">{(need * r.count).toFixed(1)}</span></div>
              <Button size="sm" variant="ghost" className="col-span-1 h-7 px-0 text-red-600" onClick={() => onRemove(r.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-muted-foreground">{copyFor(language, 'Plant · Count · Run min/wk · Gallons/wk', 'النبات · العدد · دقائق التشغيل/أسبوع · غالون/أسبوع')}</div>
    </div>
  );
}


