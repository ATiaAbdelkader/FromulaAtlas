'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CalendarDays, Sparkles, Download, Edit3, Check, Plus, Trash2,
  Sprout, Droplets, FlaskConical, Bug, Users, FileText,
} from 'lucide-react';
import {
  CROP_LIFECYCLES,
} from '@/lib/crop-lifecycle';
import {
  generateCropCalendar, getIrrigationSystems,
  type CropCalendarResult, type CalendarEntry,
} from '@/lib/crop-calendar-generator';

export function CropCalendarGenerator() {
  const [cropId, setCropId] = useState('maize');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().slice(0, 10));
  const [area, setArea] = useState('1');
  const [irrigationSystem, setIrrigationSystem] = useState('drip');
  const [avgET0, setAvgET0] = useState('5');
  const [result, setResult] = useState<CropCalendarResult | null>(null);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState<Record<number, string>>({});

  const generate = useCallback(() => {
    const r = generateCropCalendar({
      cropId,
      plantingDate,
      area: parseFloat(area) || 1,
      irrigationSystem,
      avgET0: parseFloat(avgET0) || 5,
    });
    setResult(r);
    setEditingWeek(null);
    setCustomNotes({});
  }, [cropId, plantingDate, area, irrigationSystem, avgET0]);

  const exportPDF = useCallback(() => {
    if (!result) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const weeksHTML = result.weeks.map(w => {
      const laborText = w.labor.map(l => `${l.task} (${l.laborDaysPerHa} d/ha, ${l.priority})`).join('<br>');
      const fertText = w.fertilization.map(f => `${f.stage}: N${f.n} P${f.p} K${f.k} — ${f.sources.map(s => s.material).join(', ')}`).join('<br>');
      const riskText = w.risks.map(r => `${r.problem.name}: ${r.recommendedActives.map(a => a.name).join(', ')}`).join('<br>');
      const note = customNotes[w.week] || '';
      return `<tr>
        <td style="text-align:center;font-weight:bold">${w.week}</td>
        <td style="text-align:center;font-size:10px">${w.date || w.dayRange}</td>
        <td>${w.stageEmoji} ${w.stage}<br><span style="font-size:9px;color:#666">Kc: ${w.kc.toFixed(2)}</span></td>
        <td style="font-size:10px">${laborText || '—'}</td>
        <td style="font-size:10px">${fertText || '—'}</td>
        <td style="text-align:center;font-size:10px">${w.irrigation.etc.toFixed(1)} mm<br><span style="color:#666">${w.irrigation.note}</span></td>
        <td style="font-size:10px">${riskText || '—'}</td>
        ${note ? `<td style="font-size:10px;font-style:italic">${note}</td>` : ''}
      </tr>`;
    }).join('');

    win.document.write(`<!doctype html><html><head><title>Calendrier Cultural — ${result.crop.name}</title>
      <style>
        body { font-family: -apple-system, sans-serif; margin: 20px; color: #1f2937; }
        h1 { color: #059669; border-bottom: 3px solid #059669; padding-bottom: 8px; font-size: 20px; }
        .header { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .header div { font-size: 11px; }
        .header strong { color: #059669; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #ecfdf5; padding: 6px 4px; text-align: left; border: 1px solid #d1d5db; color: #065f46; font-size: 10px; }
        td { padding: 5px 4px; border: 1px solid #d1d5db; vertical-align: top; }
        .footer { margin-top: 16px; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        .milestone { background: #fef3c7; }
        @media print { @page { margin: 0.8cm; landscape; } }
      </style></head><body>
      <h1>${result.crop.emoji} Calendrier Cultural Complet — ${result.crop.name}</h1>
      <div class="header">
        <div>
          <strong>Date de plantation:</strong> ${result.plantingDate}<br>
          <strong>Surface:</strong> ${result.area} ha<br>
          <strong>Système d'irrigation:</strong> ${result.irrigationSystem} (η = ${(result.irrigationEfficiency * 100).toFixed(0)}%)<br>
          <strong>ET₀ moyen:</strong> ${avgET0} mm/jour
        </div>
        <div>
          <strong>Semence:</strong> ${result.seedRate.kgPerHa.toFixed(0)} kg/ha, ${result.seedRate.plantsPerM2.toFixed(0)} plants/m²<br>
          <strong>Espacement:</strong> ${result.seedRate.plantSpacing.toFixed(1)} cm × ${result.seedRate.rowSpacing} cm<br>
          <strong>N total:</strong> ${result.totalSeason.n.toFixed(0)} kg · <strong>P:</strong> ${result.totalSeason.p.toFixed(0)} kg · <strong>K:</strong> ${result.totalSeason.k.toFixed(0)} kg<br>
          <strong>Irrigation totale:</strong> ${result.totalSeason.irrigationM3.toFixed(0)} m³ · <strong>Main d'œuvre:</strong> ${result.totalSeason.laborDays.toFixed(0)} jours
        </div>
      </div>
      <table>
        <thead><tr>
          <th>Sem.</th><th>Date</th><th>Stade</th><th>Travaux</th><th>Fertilisation</th><th>Irrigation</th><th>Sanitaire</th>
          ${Object.keys(customNotes).length > 0 ? '<th>Notes</th>' : ''}
        </tr></thead>
        <tbody>${weeksHTML}</tbody>
      </table>
      <div class="footer">
        ⚠️ Ce calendrier est une aide à la décision basée sur les données FAO-56, INPV 2017, et NRC 2021.
        Ajustez selon les conditions locales (climat, sol, pression parasitaire).
        Généré par Formula Atlas — ${new Date().toLocaleString('fr-FR')}
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }, [result, customNotes, avgET0]);

  return (
    <Card className="overflow-hidden border-emerald-200/60 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-teal-50/50 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-emerald-600" /> Crop Calendar Generator
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">One-click complete farm calendar: planting + fertilization + irrigation + pest control + labor · editable · PDF export</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Crop</Label>
            <select aria-label="Crop" value={cropId} onChange={e => setCropId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {CROP_LIFECYCLES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">Planting date</Label>
            <Input aria-label="Planting date" type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-medium">Area (ha)</Label>
            <Input aria-label="Field area in hectares" value={area} onChange={e => setArea(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">Irrigation system</Label>
            <select aria-label="Irrigation system" value={irrigationSystem} onChange={e => setIrrigationSystem(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {getIrrigationSystems().map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">Avg ET₀ (mm/day)</Label>
            <Input aria-label="Average reference evapotranspiration" value={avgET0} onChange={e => setAvgET0(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <Button size="sm" onClick={generate} className="h-11 w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
          <Sparkles className="h-3.5 w-3.5" /> Generate Complete Calendar
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary header */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl">{result.crop.emoji}</span>
                <div>
                  <div className="text-sm font-bold">{result.crop.name}</div>
                  <div className="text-[10px] text-emerald-100">{result.weeks.length} weeks · {result.crop.seasonLength} days</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                <div><div className="text-[9px] text-emerald-200 uppercase">Seed</div><div className="font-mono font-bold">{result.seedRate.kgPerHa.toFixed(0)} kg/ha</div></div>
                <div><div className="text-[9px] text-emerald-200 uppercase">N-P-K</div><div className="font-mono font-bold">{result.totalSeason.n.toFixed(0)}-{result.totalSeason.p.toFixed(0)}-{result.totalSeason.k.toFixed(0)}</div></div>
                <div><div className="text-[9px] text-emerald-200 uppercase">Irrigation</div><div className="font-mono font-bold">{result.totalSeason.irrigationM3.toFixed(0)} m³</div></div>
                <div><div className="text-[9px] text-emerald-200 uppercase">Labor</div><div className="font-mono font-bold">{result.totalSeason.laborDays.toFixed(0)} days</div></div>
              </div>
            </div>

            {/* Seed rate info */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/10">
              <Sprout className="h-3 w-3 inline mr-1 text-emerald-600" />
              <strong>Seed rate:</strong> {result.seedRate.kgPerHa.toFixed(0)} kg/ha · {result.seedRate.plantsPerM2.toFixed(0)} plants/m² · spacing {result.seedRate.plantSpacing.toFixed(1)}cm × {result.seedRate.rowSpacing}cm
            </div>

            {/* Calendar table */}
            <div className="max-h-[520px] overflow-auto rounded-xl border bg-background shadow-sm">
              <table className="w-full min-w-[980px] text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                  <tr className="text-left text-[9px] text-muted-foreground uppercase">
                    <th className="px-3 py-2">Wk</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Stage</th>
                    <th className="px-3 py-2">Travaux / Labor</th>
                    <th className="px-3 py-2">Fertilisation</th>
                    <th className="px-3 py-2">Irrigation</th>
                    <th className="px-3 py-2">Sanitaire / Risks</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {result.weeks.map((w) => (
                    <CalendarRow
                      key={w.week}
                      entry={w}
                      area={parseFloat(area) || 1}
                      note={customNotes[w.week] || ''}
                      isEditing={editingWeek === w.week}
                      onEdit={() => setEditingWeek(w.week)}
                      onSave={(note) => { setCustomNotes(prev => ({ ...prev, [w.week]: note })); setEditingWeek(null); }}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Export */}
            <Button size="sm" onClick={exportPDF} className="h-11 w-full gap-2">
              <FileText className="h-3.5 w-3.5" /> Export Complete Calendar (PDF)
            </Button>

            <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 Click ✏️ on any row to add custom notes. The calendar combines FAO-56 crop coefficients, INPV 2017 pest control data, NRC 2021 feed standards, and crop lifecycle phenology. Edit notes before exporting to PDF.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Calendar Row (editable)
// ============================================================================

function CalendarRow({ entry, area, note, isEditing, onEdit, onSave }: {
  entry: CalendarEntry;
  area: number;
  note: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (note: string) => void;
}) {
  const [noteDraft, setNoteDraft] = useState(note);

  const laborText = entry.labor.length > 0
    ? entry.labor.map(l => `${l.task}`).join('; ')
    : '—';
  const fertText = entry.fertilization.length > 0
    ? entry.fertilization.map(f => `N${f.n} P${f.p} K${f.k} (${f.method})`).join('; ')
    : '—';
  const riskText = entry.risks.length > 0
    ? entry.risks.slice(0, 2).map(r => `${r.problem.name}: ${r.recommendedActives.slice(0, 2).map(a => a.name).join(', ')}`).join('; ')
    : '—';
  const irrM3 = entry.irrigation.etc * 10 * area / 1; // approx m³

  const hasMilestone = Boolean(entry.milestone);
  const hasContent = entry.labor.length > 0 || entry.fertilization.length > 0 || entry.risks.length > 0 || hasMilestone;

  return (
    <tr className={`border-t hover:bg-muted/20 ${hasMilestone ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''} ${!hasContent ? 'opacity-50' : ''}`}>
      <td className="px-2 py-1.5 font-mono font-bold text-center">{entry.week}</td>
      <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{entry.date?.slice(5) || entry.dayRange}</td>
      <td className="px-2 py-1.5">
        <span>{entry.stageEmoji}</span>{' '}
        <span className="text-[10px]">{entry.stage}</span>
        <span className="text-[9px] text-muted-foreground block">Kc {entry.kc.toFixed(2)}</span>
        {entry.milestone && <span className="text-[9px] text-amber-700 dark:text-amber-400 block font-medium">{entry.milestone}</span>}
      </td>
      <td className="px-2 py-1.5 text-[10px] max-w-[180px]">
        {entry.labor.length > 0 ? entry.labor.map((l, i) => (
          <div key={i} className="flex items-start gap-1">
            <span className={`text-[8px] mt-0.5 ${l.priority === 'critical' ? 'text-rose-600' : l.priority === 'recommended' ? 'text-amber-600' : 'text-muted-foreground'}`}>●</span>
            <span>{l.task} <span className="text-muted-foreground">({l.laborDaysPerHa}d/ha)</span></span>
          </div>
        )) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-2 py-1.5 text-[10px] max-w-[150px]">
        {entry.fertilization.length > 0 ? entry.fertilization.map((f, i) => (
          <div key={i}>
            <span className="font-mono">N{f.n} P{f.p} K{f.k}</span>
            {f.ca ? <span className="text-muted-foreground"> Ca{f.ca}</span> : null}
            <br />
            <span className="text-[9px] text-muted-foreground">{f.sources.map(s => s.material).join(', ')}</span>
          </div>
        )) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-2 py-1.5 text-[10px] text-center">
        <div className="font-mono">{entry.irrigation.etc.toFixed(1)} mm</div>
        <div className="text-[9px] text-cyan-600">{irrM3.toFixed(0)} m³</div>
      </td>
      <td className="px-2 py-1.5 text-[10px] max-w-[150px]">
        {entry.risks.length > 0 ? entry.risks.slice(0, 2).map((r, i) => (
          <div key={i}>
            <span className={r.type === 'disease' ? 'text-rose-600' : r.type === 'pest' ? 'text-amber-600' : 'text-lime-600'}>
              {r.type === 'disease' ? '🦠' : r.type === 'pest' ? '🐛' : '🌿'}
            </span>{' '}
            <span className="font-medium">{r.problem.name}</span>
            <br />
            <span className="text-[9px] text-muted-foreground">→ {r.recommendedActives.slice(0, 2).map(a => a.name).join(', ')}</span>
          </div>
        )) : <span className="text-muted-foreground">—</span>}
        {entry.risks.length > 2 && <span className="text-[9px] text-muted-foreground">+{entry.risks.length - 2} more</span>}
      </td>
      <td className="px-2 py-1.5 text-[10px]">
        {isEditing ? (
          <div className="flex gap-1">
            <Textarea
              aria-label={`Note for week ${entry.week}`}
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              className="min-h-[44px] h-11 text-xs"
              placeholder="Add note…"
              autoFocus
            />
              <Button size="sm" variant="ghost" aria-label={`Save note for week ${entry.week}`} onClick={() => onSave(noteDraft)} className="h-9 w-9 shrink-0 p-0"><Check className="h-4 w-4 text-emerald-600" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[10px] italic text-muted-foreground truncate max-w-[80px]">{note || ''}</span>
            <button type="button" aria-label={`Edit note for week ${entry.week}`} onClick={() => { setNoteDraft(note); onEdit(); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </td>
    </tr>
  );
}
