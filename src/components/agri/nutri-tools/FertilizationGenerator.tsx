'use client';

/**
 * Fertilization Generator — week-by-week N/P/K + micronutrient schedule
 * based on each crop's phenology stages.
 *
 * Uses the crop lifecycle database (@/lib/crop-lifecycle) which encodes
 * FAO-56 + extension-service fertilization plans for 20 major crops.
 *
 * Output:
 *   - Per-stage fertilization cards with day-of-season, method, NPK + micros,
 *     recommended source materials, and notes
 *   - Season totals bar chart
 *   - Application timeline (horizontal Gantt-style)
 *   - PDF export (via window.print() on a styled HTML document)
 *   - Adjust field area (hectares) to scale all rates
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sprout, FlaskConical, Download, Calendar, Beaker, Activity,
  TrendingUp, AlertTriangle, CheckCircle2, MapPin,
} from 'lucide-react';
import {
  CROP_LIFECYCLES, getCropLifecycle, stageForDay,
  type CropLifecycle, type FertilizationApplication,
} from '@/lib/crop-lifecycle';

export function FertilizationGenerator() {
  const [cropId, setCropId] = useState<string>('maize');
  const [areaHa, setAreaHa] = useState<number>(1);
  const [plantingDate, setPlantingDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  const crop = useMemo<CropLifecycle>(
    () => getCropLifecycle(cropId) ?? CROP_LIFECYCLES[0],
    [cropId],
  );

  // Scale all kg/ha values to total kg by field area.
  const scaledApps = useMemo(() => {
    return crop.fertilization.applications.map(app => ({
      ...app,
      nTotal: app.n * areaHa,
      pTotal: app.p * areaHa,
      kTotal: app.k * areaHa,
      caTotal: (app.ca || 0) * areaHa,
      mgTotal: (app.mg || 0) * areaHa,
      sTotal: (app.s || 0) * areaHa,
      feTotal: (app.fe || 0) * areaHa / 1000, // g/ha → kg
      mnTotal: (app.mn || 0) * areaHa / 1000,
      bTotal: (app.b || 0) * areaHa / 1000,
      znTotal: (app.zn || 0) * areaHa / 1000,
      cuTotal: (app.cu || 0) * areaHa / 1000,
      dateOffset: addDays(plantingDate, app.day),
    }));
  }, [crop, areaHa, plantingDate]);

  const totals = useMemo(() => {
    const t = { n: 0, p: 0, k: 0, ca: 0, mg: 0, s: 0, fe: 0, mn: 0, b: 0, zn: 0, cu: 0 };
    for (const a of scaledApps) {
      t.n += a.nTotal; t.p += a.pTotal; t.k += a.kTotal;
      t.ca += a.caTotal; t.mg += a.mgTotal; t.s += a.sTotal;
      t.fe += a.feTotal; t.mn += a.mnTotal; t.b += a.bTotal;
      t.zn += a.znTotal; t.cu += a.cuTotal;
    }
    return t;
  }, [scaledApps]);

  const exportPdf = useCallback(() => {
    const win = window.open('', '_blank');
    if (!win) return;
    const stages = crop.stages;
    win.document.write(`<!doctype html><html><head><title>Fertilization Plan — ${crop.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; color: #1f2937; }
        h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
        h2 { color: #166534; margin-top: 24px; font-size: 14px; text-transform: uppercase; }
        .meta { font-size: 11px; color: #64748b; margin: 4px 0 16px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 11px; }
        th { background: #f0fdf4; padding: 6px 8px; text-align: left; border: 1px solid #d1d5db; color: #166534; }
        td { padding: 6px 8px; border: 1px solid #d1d5db; }
        tr:nth-child(even) td { background: #fafafa; }
        .totals { background: #ecfdf5; padding: 12px; border-radius: 6px; margin: 12px 0; }
        .totals strong { color: #047857; }
        .stage-pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; background: #dbeafe; color: #1e40af; margin: 2px; }
        .notes { font-size: 10px; color: #475569; font-style: italic; margin-top: 4px; }
        .sources { font-size: 10px; color: #475569; margin-top: 2px; }
        @media print { @page { margin: 1cm; } }
      </style></head><body>
      <h1>${crop.emoji} Fertilization Plan — ${crop.name}</h1>
      <div class="meta">
        <strong>Field area:</strong> ${areaHa} ha ·
        <strong>Planting date:</strong> ${plantingDate} ·
        <strong>Season length:</strong> ${crop.seasonLength} days ·
        <strong>Generated:</strong> ${new Date().toLocaleString()}
      </div>
      <p style="font-size: 11px; color: #475569;">${crop.notes}</p>

      <h2>Phenology Stages</h2>
      <div>
        ${stages.map(s => `<span class="stage-pill">${s.emoji} ${s.name} (D${s.startDay}–${s.endDay}, Kc ${s.kc})</span>`).join('')}
      </div>

      <h2>Season Totals (kg for ${areaHa} ha)</h2>
      <div class="totals">
        <strong>N:</strong> ${totals.n.toFixed(1)} kg ·
        <strong>P:</strong> ${totals.p.toFixed(1)} kg ·
        <strong>K:</strong> ${totals.k.toFixed(1)} kg ·
        <strong>Ca:</strong> ${totals.ca.toFixed(1)} kg ·
        <strong>Mg:</strong> ${totals.mg.toFixed(1)} kg ·
        <strong>S:</strong> ${totals.s.toFixed(1)} kg
        ${totals.b > 0 ? `· <strong>B:</strong> ${totals.b.toFixed(2)} kg` : ''}
        ${totals.zn > 0 ? `· <strong>Zn:</strong> ${totals.zn.toFixed(2)} kg` : ''}
        ${totals.mn > 0 ? `· <strong>Mn:</strong> ${totals.mn.toFixed(2)} kg` : ''}
        ${totals.fe > 0 ? `· <strong>Fe:</strong> ${totals.fe.toFixed(2)} kg` : ''}
      </div>

      <h2>Application Schedule</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th><th>Date</th><th>Stage</th><th>Method</th>
            <th>N</th><th>P</th><th>K</th><th>Other</th>
            <th>Sources</th><th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${scaledApps.map(a => `
            <tr>
              <td>${a.day}</td>
              <td>${a.dateOffset}</td>
              <td>${a.stage}</td>
              <td>${a.method.replace(/_/g, ' ')}</td>
              <td>${a.nTotal.toFixed(1)}</td>
              <td>${a.pTotal.toFixed(1)}</td>
              <td>${a.kTotal.toFixed(1)}</td>
              <td>${otherNutrientsStr(a)}</td>
              <td>${a.sources.map(s => `${s.nutrient}: ${s.material} @ ${s.rate}`).join('<br>')}</td>
              <td>${a.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="font-size: 10px; color: #64748b; margin-top: 24px;">
        Generated by Formula Atlas — Fertilization Generator. Rates are research-based defaults; always adjust to local soil test results.
      </p>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [crop, areaHa, plantingDate, scaledApps, totals]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-emerald-600" /> Fertilization Generator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">FAO-56 + extension service plans · 20 crops · week-by-week schedule with sources</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Crop</Label>
            <select
              value={cropId}
              onChange={e => setCropId(e.target.value)}
              className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"
            >
              {CROP_LIFECYCLES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[10px]">Field area (hectares)</Label>
            <Input
              type="number" min={0.1} step={0.1}
              value={areaHa}
              onChange={e => setAreaHa(Math.max(0.1, parseFloat(e.target.value) || 1))}
              className="h-8 text-xs mt-0.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Planting date</Label>
            <Input
              type="date"
              value={plantingDate}
              onChange={e => setPlantingDate(e.target.value)}
              className="h-8 text-xs mt-0.5"
            />
          </div>
          <div>
            <Label className="text-[10px]">Climate</Label>
            <div className="text-[10px] text-muted-foreground mt-2 leading-tight">{crop.climate}</div>
          </div>
        </div>

        {/* Stage chips */}
        <div className="flex flex-wrap gap-1">
          {crop.stages.map(s => (
            <Badge key={s.name} variant="outline" className="text-[10px]">
              {s.emoji} {s.name}
              <span className="text-muted-foreground ml-1">D{s.startDay}–{s.endDay} · Kc {s.kc}</span>
            </Badge>
          ))}
        </div>

        {/* Season totals */}
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Season totals ({areaHa} ha)</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
            <NutrientTotal label="N" value={totals.n} unit="kg" color="emerald" />
            <NutrientTotal label="P" value={totals.p} unit="kg" color="indigo" />
            <NutrientTotal label="K" value={totals.k} unit="kg" color="amber" />
            <NutrientTotal label="Ca" value={totals.ca} unit="kg" color="cyan" />
            <NutrientTotal label="Mg" value={totals.mg} unit="kg" color="violet" />
            <NutrientTotal label="S" value={totals.s} unit="kg" color="yellow" />
          </div>
          {(totals.b + totals.zn + totals.mn + totals.fe + totals.cu) > 0 && (
            <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/50 text-[10px] text-muted-foreground">
              <strong className="text-emerald-700 dark:text-emerald-300">Micronutrients (g):</strong>{' '}
              {totals.b > 0 && <span>B {totals.b.toFixed(0)} · </span>}
              {totals.zn > 0 && <span>Zn {totals.zn.toFixed(0)} · </span>}
              {totals.mn > 0 && <span>Mn {totals.mn.toFixed(0)} · </span>}
              {totals.fe > 0 && <span>Fe {totals.fe.toFixed(0)} · </span>}
              {totals.cu > 0 && <span>Cu {totals.cu.toFixed(0)}</span>}
            </div>
          )}
        </div>

        {/* Application timeline (Gantt-style) */}
        <ApplicationTimeline crop={crop} apps={scaledApps} />

        {/* Application cards */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Application schedule ({scaledApps.length} events)
          </div>
          {scaledApps.map((a, i) => {
            const stage = stageForDay(crop, Math.max(1, a.day));
            return (
              <div key={i} className="rounded-md border bg-background p-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] font-mono">D{a.day}</Badge>
                    <span className="text-[10px] text-muted-foreground">{a.dateOffset}</span>
                    {stage && <span className="text-[10px]">{stage.emoji} {stage.name}</span>}
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase">{a.method.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px] mb-1.5">
                  {a.nTotal > 0 && <NutrientCell label="N" value={a.nTotal} unit="kg" />}
                  {a.pTotal > 0 && <NutrientCell label="P" value={a.pTotal} unit="kg" />}
                  {a.kTotal > 0 && <NutrientCell label="K" value={a.kTotal} unit="kg" />}
                  {a.caTotal > 0 && <NutrientCell label="Ca" value={a.caTotal} unit="kg" />}
                  {a.mgTotal > 0 && <NutrientCell label="Mg" value={a.mgTotal} unit="kg" />}
                  {a.sTotal > 0 && <NutrientCell label="S" value={a.sTotal} unit="kg" />}
                  {a.bTotal > 0 && <NutrientCell label="B" value={a.bTotal * 1000} unit="g" />}
                  {a.znTotal > 0 && <NutrientCell label="Zn" value={a.znTotal * 1000} unit="g" />}
                  {a.mnTotal > 0 && <NutrientCell label="Mn" value={a.mnTotal * 1000} unit="g" />}
                  {a.feTotal > 0 && <NutrientCell label="Fe" value={a.feTotal * 1000} unit="g" />}
                </div>
                <div className="text-[10px] text-muted-foreground mb-1">
                  <strong className="text-foreground">Sources:</strong>{' '}
                  {a.sources.map((s, j) => (
                    <span key={j}>
                      {j > 0 && ' · '}
                      <strong>{s.nutrient}</strong>: {s.material} @ {s.rate}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 italic flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{a.notes}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Export + general notes */}
        <Button size="sm" onClick={exportPdf} className="gap-1.5 w-full">
          <Download className="h-3.5 w-3.5" /> Export fertilization plan (PDF)
        </Button>

        <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 p-2 text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          <div>{crop.notes}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Application timeline (Gantt-style SVG)
// ============================================================================

function ApplicationTimeline({ crop, apps }: { crop: CropLifecycle; apps: (FertilizationApplication & { dateOffset: string })[] }) {
  const W = 320, H = 60, pad = 8;
  const span = crop.seasonLength;

  // Stage backgrounds
  const stages = crop.stages.map(s => {
    const x1 = pad + ((s.startDay - 1) / span) * (W - 2 * pad);
    const x2 = pad + (s.endDay / span) * (W - 2 * pad);
    return { ...s, x1, x2 };
  });

  const methodColor: Record<string, string> = {
    broadcast: '#0ea5e9',
    band: '#8b5cf6',
    side_dress: '#f59e0b',
    fertigation: '#10b981',
    foliar: '#ec4899',
    seed_treatment: '#64748b',
  };

  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Application timeline</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Fertilization timeline">
        {/* Stage background bands */}
        {stages.map(s => (
          <rect key={s.name} x={s.x1} y={pad} width={Math.max(2, s.x2 - s.x1)} height={H - 2 * pad}
            fill={s.emoji === '💤' ? '#1e293b' : s.emoji === '🌼' ? '#fbbf24' : '#86efac'}
            opacity={0.15} />
        ))}
        {/* Day-0 line */}
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#475569" strokeWidth="0.5" />
        {/* Application markers */}
        {apps.map((a, i) => {
          const x = pad + (Math.max(0, a.day) / span) * (W - 2 * pad);
          const color = methodColor[a.method] || '#0ea5e9';
          const intensity = (a.n + a.p + a.k) / 100;  // bigger apps = taller marker
          const h = 8 + Math.min(20, intensity * 6);
          return (
            <g key={i}>
              <line x1={x} y1={H - pad} x2={x} y2={H - pad - h} stroke={color} strokeWidth="2" />
              <circle cx={x} cy={H - pad - h} r="3" fill={color} />
              <text x={x} y={H - pad + 6} fontSize="6" textAnchor="middle" className="fill-muted-foreground font-mono">D{a.day}</text>
            </g>
          );
        })}
        {/* End label */}
        <text x={W - pad} y={H - 2} fontSize="7" textAnchor="end" className="fill-muted-foreground font-mono">D{span}</text>
      </svg>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {Object.entries(methodColor).map(([m, c]) => (
          <span key={m} className="text-[9px] flex items-center gap-0.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            {m.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
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

function otherNutrientsStr(a: any): string {
  const parts: string[] = [];
  if (a.caTotal > 0) parts.push(`Ca ${a.caTotal.toFixed(1)}`);
  if (a.mgTotal > 0) parts.push(`Mg ${a.mgTotal.toFixed(1)}`);
  if (a.sTotal > 0) parts.push(`S ${a.sTotal.toFixed(1)}`);
  if (a.bTotal > 0) parts.push(`B ${(a.bTotal * 1000).toFixed(0)}g`);
  if (a.znTotal > 0) parts.push(`Zn ${(a.znTotal * 1000).toFixed(0)}g`);
  if (a.mnTotal > 0) parts.push(`Mn ${(a.mnTotal * 1000).toFixed(0)}g`);
  if (a.feTotal > 0) parts.push(`Fe ${(a.feTotal * 1000).toFixed(0)}g`);
  return parts.join(' · ') || '—';
}

const NUTRIENT_COLORS: Record<string, string> = {
  N: 'emerald', P: 'indigo', K: 'amber',
  Ca: 'cyan', Mg: 'violet', S: 'yellow',
  B: 'rose', Zn: 'teal', Mn: 'purple', Fe: 'orange', Cu: 'pink',
};

function NutrientTotal({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-md border border-emerald-200/40 dark:border-emerald-900/40 bg-background/60 px-2 py-1">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold">{value > 0 ? value.toFixed(1) : '—'}<span className="text-[9px] text-muted-foreground ml-0.5">{value > 0 ? unit : ''}</span></div>
    </div>
  );
}

function NutrientCell({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded border bg-background px-1.5 py-1">
      <div className="text-[8px] text-muted-foreground uppercase">{label}</div>
      <div className="font-mono text-[10px] font-semibold">{value.toFixed(1)}<span className="text-[8px] text-muted-foreground ml-0.5">{unit}</span></div>
    </div>
  );
}
