'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CalendarDays, Sparkles, Download, Edit3, Check, Plus, Trash2,
  Sprout, Droplets, FlaskConical, Bug, Users, FileText, BookOpen,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  CROP_LIFECYCLES,
} from '@/lib/crop-lifecycle';
import {
  generateCropCalendar, getIrrigationSystems,
  type CropCalendarResult, type CalendarEntry,
} from '@/lib/crop-calendar-generator';
import {
  formatFertialAmounts,
  getFertialCropOptions,
  getFertialGuidance,
} from '@/lib/fertial-fertilization';
import {
  fetchEnrichedPhytoIndex, indexByActiveEnriched, findBrandsForActive,
  type EnrichedPhytoProduct,
} from '@/lib/phyto-enriched';

export function CropCalendarGenerator() {
  const { language } = useTranslation();
  const [cropId, setCropId] = useState('maize');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().slice(0, 10));
  const [area, setArea] = useState('1');
  const [irrigationSystem, setIrrigationSystem] = useState('drip');
  const [avgET0, setAvgET0] = useState('5');
  const [result, setResult] = useState<CropCalendarResult | null>(null);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState<Record<number, string>>({});
  const fertialOptions = useMemo(() => getFertialCropOptions(), []);
  const [fertialCropId, setFertialCropId] = useState('wheat');
  const fertialReference = useMemo(() => getFertialGuidance(fertialCropId) ?? null, [fertialCropId]);
  const fertialDisplayName = fertialReference
    ? language === 'ar' ? fertialReference.nameAr : language === 'fr' ? fertialReference.nameFr : fertialReference.name
    : '';

  // Load INPV 2017 enriched product index (1,264 commercial products) — used
  // to display matching Algerian-registered brands next to each recommended
  // active substance in the risk column.
  const [phytoProducts, setPhytoProducts] = useState<EnrichedPhytoProduct[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchEnrichedPhytoIndex()
      .then((list) => { if (alive) setPhytoProducts(list); })
      .catch(() => { /* silent — calendar still works without enrichment */ });
    return () => { alive = false; };
  }, []);
  const phytoByActive = useMemo(
    () => phytoProducts ? indexByActiveEnriched(phytoProducts) : null,
    [phytoProducts],
  );

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
      const riskText = w.risks.map(r => {
        const activesText = r.recommendedActives.map(a => a.name).join(', ');
        // Look up matching INPV-registered brands for the first active substance
        let brandsText = '';
        if (phytoByActive && r.recommendedActives[0]) {
          const brands = findBrandsForActive(phytoByActive, r.recommendedActives[0].activeSubstance, 3);
          if (brands.length > 0) {
            brandsText = ` <span style="color:#059669;font-size:9px">[INPV: ${brands.map(b => `${b.brand}${b.darRange !== '—' ? ` (DAR ${b.darRange})` : ''}${b.toxicToBees ? ' 🐝' : ''}${b.toxicToAquatic ? ' 🐟' : ''}`).join(', ')}]</span>`;
          }
        }
        return `${r.problem.name}: ${activesText}${brandsText}`;
      }).join('<br>');
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
    const fertialReference = result.fertialGuidance ? `<h2>Référence du manuel Fertial</h2><p>${result.fertialGuidance.summary}</p><ul>${result.fertialGuidance.applications.map(application => `<li><strong>${application.timing}</strong> · ${formatFertialAmounts(application.amounts)} · ${application.method}</li>`).join('')}</ul><p class="footer">Source : ${result.fertialGuidance.source.document}, ${result.fertialGuidance.source.pages} — ${result.fertialGuidance.source.url}</p>` : '';

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
      ${fertialReference}
      <div class="footer">
        ⚠️ Ce calendrier est une aide à la décision basée on FAO-56, INPV 2017, NRC 2021, and the Fertial manual where a crop profile is available.
        Ajustez selon les conditions locales (climat, sol, pression parasitaire).
        Généré par Formula Atlas — ${new Date().toLocaleString('fr-FR')}
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }, [result, customNotes, avgET0, language]);

  return (
    <Card className="overflow-hidden border-emerald-200/60 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-teal-50/50 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-emerald-600" /> {copyFor(language, 'Crop Calendar Generator', 'مولّد تقويم المحصول')}
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'One-click complete farm calendar: planting + fertilization + irrigation + pest control + labor · editable · PDF export', 'تقويم زراعي كامل بنقرة واحدة: الزراعة + التسميد + الري + مكافحة الآفات + العمالة · قابل للتعديل · تصدير PDF')}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label>
            <select aria-label={copyFor(language, 'Crop', 'المحصول')} value={cropId} onChange={e => setCropId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {CROP_LIFECYCLES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Planting date', 'تاريخ الزراعة')}</Label>
            <Input aria-label={copyFor(language, 'Planting date', 'تاريخ الزراعة')} type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Area (ha)', 'المساحة (هكتار)')}</Label>
            <Input aria-label={copyFor(language, 'Field area in hectares', 'مساحة الحقل بالهكتار')} value={area} onChange={e => setArea(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Irrigation system', 'نظام الري')}</Label>
            <select aria-label={copyFor(language, 'Irrigation system', 'نظام الري')} value={irrigationSystem} onChange={e => setIrrigationSystem(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {getIrrigationSystems().map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Avg ET₀ (mm/day)', 'متوسط ET₀ (مم/يوم)')}</Label>
            <Input aria-label={copyFor(language, 'Average reference evapotranspiration', 'متوسط البخر-نتح المرجعي')} value={avgET0} onChange={e => setAvgET0(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <Button size="sm" onClick={generate} className="h-11 w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
          <Sparkles className="h-3.5 w-3.5" /> {copyFor(language, 'Generate Complete Calendar', 'إنشاء التقويم الكامل')}
        </Button>

        {/* Complete Fertial schedule library: reference-only when no lifecycle exists */}
        {fertialReference && <section className="rounded-xl border border-lime-200 bg-lime-50/50 p-3 dark:border-lime-900/70 dark:bg-lime-950/15">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-300" />
                <h3 className="text-xs font-semibold text-lime-950 dark:text-lime-100">{copyFor(language, 'Fertial Manual Schedule Library', 'مكتبة جداول دليل Fertial')}</h3>
                <Badge variant="outline" className="border-lime-300 bg-background/70 text-[10px] text-lime-800 dark:border-lime-800 dark:text-lime-200">{copyFor(language, 'Source reference', 'مرجع مصدر')}</Badge>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-lime-950/75 dark:text-lime-100/75">{copyFor(language, 'All 39 extracted Fertial crop schedules are available here. This additive reference does not invent lifecycle, irrigation, labor, or pest data for crops not yet supported by the canonical calendar.', 'تتوفر هنا جداول التسميد التسعة والثلاثون المستخرجة من دليل Fertial. هذا المرجع الإضافي لا يخترع مراحل نمو أو ري أو عمالة أو بيانات آفات للمحاصيل غير المدعومة بعد في التقويم الأساسي.')}</p>
            </div>
            <div className="w-full shrink-0 sm:w-64">
              <Label className="text-[10px] font-medium text-lime-950 dark:text-lime-100">{copyFor(language, 'Select Fertial crop schedule', 'اختر جدول المحصول من Fertial')}</Label>
              <select aria-label={copyFor(language, 'Select Fertial crop schedule', 'اختر جدول المحصول من Fertial')} value={fertialCropId} onChange={e => setFertialCropId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-lime-300 bg-background px-3 text-sm dark:border-lime-800">
                {fertialOptions.map(option => <option key={option.id} value={option.id}>{language === 'ar' ? option.nameAr : language === 'fr' ? option.nameFr : option.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-lime-200/80 bg-background/70 p-3 dark:border-lime-900/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><div className="text-sm font-semibold">{fertialDisplayName}</div><div className="text-[10px] text-muted-foreground">{fertialReference.category} · {fertialReference.summary}</div></div>
              <Badge variant="secondary" className="text-[10px]">{fertialReference.applications.length} {copyFor(language, 'applications', 'تطبيقات')}</Badge>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">{fertialReference.applications.map((application, index) => <div key={`${application.phase}-${application.timing}-${index}`} className="rounded-md border bg-muted/20 p-2.5"><div className="text-[10px] font-semibold">{application.timing}</div><div className="mt-1 font-mono text-[11px] font-semibold">{formatFertialAmounts(application.amounts) || copyFor(language, 'Context guidance', 'إرشاد سياقي')}</div><div className="mt-1 text-[10px] text-muted-foreground">{copyFor(language, `Method: ${application.method}`, `الطريقة: ${application.method}`)} · {application.note}</div></div>)}</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div><div className="text-[10px] font-semibold uppercase text-muted-foreground">{copyFor(language, 'Context', 'السياق')}</div><ul className="mt-1 list-disc space-y-1 pl-4 text-[10px] text-muted-foreground">{fertialReference.context.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>
              <div><div className="text-[10px] font-semibold uppercase text-muted-foreground">{copyFor(language, 'Cautions', 'الاحتياطات')}</div><ul className="mt-1 list-disc space-y-1 pl-4 text-[10px] text-muted-foreground">{fertialReference.cautions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-lime-200/80 pt-2 text-[10px] text-muted-foreground dark:border-lime-900/70"><span>{copyFor(language, `Source: ${fertialReference.source.document} · pages ${fertialReference.source.pages}`, `المصدر: ${fertialReference.source.document} · الصفحات ${fertialReference.source.pages}`)}</span><a className="font-medium text-lime-800 underline underline-offset-2 dark:text-lime-300" href={fertialReference.source.url} target="_blank" rel="noreferrer">{copyFor(language, 'Open manual source', 'فتح مصدر الدليل')}</a></div>
          </div>
        </section>}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary header */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl">{result.crop.emoji}</span>
                <div>
                  <div className="text-sm font-bold">{result.crop.name}</div>
                  <div className="text-[10px] text-emerald-100">{result.weeks.length} {copyFor(language, 'weeks', 'أسابيع')} · {result.crop.seasonLength} {copyFor(language, 'days', 'أيام')}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                <div><div className="text-[9px] text-emerald-200 uppercase">{copyFor(language, 'Seed', 'البذور')}</div><div className="font-mono font-bold">{result.seedRate.kgPerHa.toFixed(0)} kg/ha</div></div>
                <div><div className="text-[9px] text-emerald-200 uppercase">N-P-K</div><div className="font-mono font-bold">{result.totalSeason.n.toFixed(0)}-{result.totalSeason.p.toFixed(0)}-{result.totalSeason.k.toFixed(0)}</div></div>
                <div><div className="text-[9px] text-emerald-200 uppercase">{copyFor(language, 'Irrigation', 'الري')}</div><div className="font-mono font-bold">{result.totalSeason.irrigationM3.toFixed(0)} m³</div></div>
                <div><div className="text-[9px] text-emerald-200 uppercase">{copyFor(language, 'Labor', 'العمالة')}</div><div className="font-mono font-bold">{result.totalSeason.laborDays.toFixed(0)} days</div></div>
              </div>
            </div>

            {/* Seed rate info */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/10">
              <Sprout className="h-3 w-3 inline mr-1 text-emerald-600" />
              <strong>{copyFor(language, 'Seed rate:', 'معدل البذور:')}</strong> {result.seedRate.kgPerHa.toFixed(0)} kg/ha · {result.seedRate.plantsPerM2.toFixed(0)} plants/m² · {copyFor(language, 'spacing', 'التباعد')} {result.seedRate.plantSpacing.toFixed(1)}cm × {result.seedRate.rowSpacing}cm
            </div>

            {result.fertialGuidance && <section className="rounded-xl border border-lime-200 bg-lime-50/60 p-3 dark:border-lime-900/70 dark:bg-lime-950/20">
              <div className="flex items-start gap-2"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-lime-700 dark:text-lime-300" /><div className="min-w-0"><h3 className="text-xs font-semibold text-lime-950 dark:text-lime-100">{copyFor(language, 'Fertial manual timing reference', 'مرجع توقيت دليل Fertial')}</h3><p className="mt-1 text-xs leading-relaxed text-lime-950/80 dark:text-lime-100/80">{result.fertialGuidance.summary}</p></div></div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">{result.fertialGuidance.applications.map((application, index) => <div key={`${application.timing}-${index}`} className="rounded-lg border border-lime-200/80 bg-background/70 p-2.5 dark:border-lime-900/70"><div className="text-[10px] font-semibold text-lime-900 dark:text-lime-200">{application.timing}</div><div className="mt-1 font-mono text-[11px] font-semibold">{formatFertialAmounts(application.amounts)}</div><div className="mt-1 text-[10px] text-muted-foreground">{copyFor(language, `Method: ${application.method}`, `الطريقة: ${application.method}`)} · {application.note}</div></div>)}</div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-lime-200/80 pt-2 text-[10px] text-muted-foreground dark:border-lime-900/70"><span>{copyFor(language, `Source: ${result.fertialGuidance.source.document} · ${result.fertialGuidance.source.pages}`, `المصدر: ${result.fertialGuidance.source.document} · ${result.fertialGuidance.source.pages}`)}</span><a className="font-medium text-lime-800 underline underline-offset-2 dark:text-lime-300" href={result.fertialGuidance.source.url} target="_blank" rel="noreferrer">{copyFor(language, 'Open manual source', 'فتح مصدر الدليل')}</a></div>
            </section>}

            {/* Calendar table */}
            <div className="max-h-[520px] overflow-auto rounded-xl border bg-background shadow-sm">
              <table className="w-full min-w-[980px] text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                  <tr className="text-left text-[9px] text-muted-foreground uppercase">
                    <th className="px-3 py-2">{copyFor(language, 'Wk', 'أسبوع')}</th>
                    <th className="px-3 py-2">{copyFor(language, 'Date', 'التاريخ')}</th>
                    <th className="px-3 py-2">{copyFor(language, 'Stage', 'المرحلة')}</th>
                    <th className="px-3 py-2">{copyFor(language, 'Travaux / Labor', 'الأعمال / العمالة')}</th>
                    <th className="px-3 py-2">{copyFor(language, 'Fertilisation', 'التسميد')}</th>
                    <th className="px-3 py-2">{copyFor(language, 'Irrigation', 'الري')}</th>
                    <th className="px-3 py-2">{copyFor(language, 'Sanitaire / Risks', 'الحماية / المخاطر')}</th>
                    <th className="px-3 py-2">{copyFor(language, 'Notes', 'ملاحظات')}</th>
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
                      phytoByActive={phytoByActive}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Export */}
            <Button size="sm" onClick={exportPDF} className="h-11 w-full gap-2">
              <FileText className="h-3.5 w-3.5" /> {copyFor(language, 'Export Complete Calendar (PDF)', 'تصدير التقويم الكامل (PDF)')}
            </Button>

            <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 {copyFor(language, 'Click ✏️ on any row to add custom notes. The calendar combines FAO-56 crop coefficients, INPV 2017 pest control data, NRC 2021 feed standards, and crop lifecycle phenology. Edit notes before exporting to PDF.', 'اضغط على ✏️ في أي صف لإضافة ملاحظات مخصصة. يجمع التقويم معاملات المحصول من FAO-56 وبيانات مكافحة الآفات من INPV 2017 ومعايير الأعلاف من NRC 2021 ومراحل نمو المحصول. عدّل الملاحظات قبل التصدير إلى PDF.')}
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

function CalendarRow({ entry, area, note, isEditing, onEdit, onSave, phytoByActive }: {
  entry: CalendarEntry;
  area: number;
  note: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (note: string) => void;
  phytoByActive: Map<string, EnrichedPhytoProduct[]> | null;
}) {
  const { language } = useTranslation();
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
            {/* Show up to 3 matching INPV-registered commercial brands for the first active */}
            {phytoByActive && r.recommendedActives[0] && (() => {
              const brands = findBrandsForActive(phytoByActive, r.recommendedActives[0].activeSubstance, 3);
              if (brands.length === 0) return null;
              return (
                <div className="mt-0.5 flex flex-wrap gap-0.5">
                  {brands.map((b) => (
                    <Badge key={b.brand} variant="outline" className="text-[8px] py-0 px-1 font-mono" title={`INPV ${b.homologation} · ${b.concentration} · DAR ${b.darRange}${b.toxicToBees ? ' · 🐝' : ''}${b.toxicToAquatic ? ' · 🐟' : ''}`}>
                      {b.brand}
                    </Badge>
                  ))}
                </div>
              );
            })()}
          </div>
        )) : <span className="text-muted-foreground">—</span>}
        {entry.risks.length > 2 && <span className="text-[9px] text-muted-foreground">+{entry.risks.length - 2} more</span>}
      </td>
      <td className="px-2 py-1.5 text-[10px]">
        {isEditing ? (
          <div className="flex gap-1">
            <Textarea
              aria-label={`${copyFor(language, 'Note for week', 'ملاحظة للأسبوع')} ${entry.week}`}
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              className="min-h-[44px] h-11 text-xs"
              placeholder={copyFor(language, 'Add note…', 'أضف ملاحظة…')}
              autoFocus
            />
              <Button size="sm" variant="ghost" aria-label={`${copyFor(language, 'Save note for week', 'حفظ ملاحظة الأسبوع')} ${entry.week}`} onClick={() => onSave(noteDraft)} className="h-9 w-9 shrink-0 p-0"><Check className="h-4 w-4 text-emerald-600" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[10px] italic text-muted-foreground truncate max-w-[80px]">{note || ''}</span>
            <button type="button" aria-label={`${copyFor(language, 'Edit note for week', 'تعديل ملاحظة الأسبوع')} ${entry.week}`} onClick={() => { setNoteDraft(note); onEdit(); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </td>
    </tr>
  );
}
