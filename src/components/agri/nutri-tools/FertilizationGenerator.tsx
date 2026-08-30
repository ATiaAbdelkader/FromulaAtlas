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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sprout, FlaskConical, Download, Calendar, Beaker, Activity,
  TrendingUp, AlertTriangle, CheckCircle2, MapPin,
  Copy, RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  CROP_LIFECYCLES, getCropLifecycle, stageForDay,
  type CropLifecycle, type FertilizationApplication,
} from '@/lib/crop-lifecycle';

const TITLE: TrilingualString = {
  en: 'Fertilization Generator',
  ar: 'مولّد التسميد',
  fr: 'Générateur de Fertilisation',
};

const DESC: TrilingualString = {
  en: 'FAO-56 + extension service plans · 20 crops · week-by-week schedule with sources',
  ar: 'خطط FAO-56 والإرشاد الزراعي · 20 محصولاً · جدول أسبوعي مع المصادر',
  fr: 'Plans FAO-56 + vulgarisation · 20 cultures · calendrier hebdomadaire avec sources',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Rates are research-based defaults; always adjust to local soil test results. Climate, variety, and yield target influence uptake — split applications to minimize losses.',
  ar: 'المعدلات افتراضية مبنية على الأبحاث؛ اضبطها دائماً وفق نتائج تحليل التربة المحلي. تؤثر المنطقة والأصناف والهدف الإنتاجي على الامتصاص — قسّم التطبيقات لتقليل الفاقد.',
  fr: 'Les doses sont des valeurs de recherche ; ajustez toujours selon les analyses de sol locales. Climat, variété et objectif de rendement influencent l’absorption — fractionner les apports pour limiter les pertes.',
};

export function FertilizationGenerator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [copied, setCopied] = useState(false);
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
      <h1>${crop.emoji} ${copyFor(language, 'Fertilization Plan', 'خطة التسميد')} — ${crop.name}</h1>
      <div class="meta">
        <strong>${copyFor(language, 'Field area:', 'مساحة الحقل:')}</strong> ${areaHa} ha ·
        <strong>${copyFor(language, 'Planting date:', 'تاريخ الزراعة:')}</strong> ${plantingDate} ·
        <strong>${copyFor(language, 'Season length:', 'مدة الموسم:')}</strong> ${crop.seasonLength} days ·
        <strong>${copyFor(language, 'Generated:', 'تاريخ الإنشاء:')}</strong> ${new Date().toLocaleString()}
      </div>
      <p style="font-size: 11px; color: #475569;">${crop.notes}</p>

      <h2>${copyFor(language, 'Phenology Stages', 'مراحل النمو')}</h2>
      <div>
        ${stages.map(s => `<span class="stage-pill">${s.emoji} ${s.name} (D${s.startDay}–${s.endDay}, Kc ${s.kc})</span>`).join('')}
      </div>

      <h2>${copyFor(language, 'Season Totals (kg for', 'إجماليات الموسم (كغ لمساحة')} ${areaHa} ha)</h2>
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

      <h2>${copyFor(language, 'Application Schedule', 'جدول التطبيقات')}</h2>
      <table>
        <thead>
          <tr>
            <th>${copyFor(language, 'Day', 'اليوم')}</th><th>${copyFor(language, 'Date', 'التاريخ')}</th><th>${copyFor(language, 'Stage', 'المرحلة')}</th><th>${copyFor(language, 'Method', 'الطريقة')}</th>
            <th>N</th><th>P</th><th>K</th><th>${copyFor(language, 'Other', 'عناصر أخرى')}</th>
            <th>${copyFor(language, 'Sources', 'المصادر')}</th><th>${copyFor(language, 'Notes', 'ملاحظات')}</th>
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
        ${copyFor(language, 'Generated by Formula Atlas — Fertilization Generator. Rates are research-based defaults; always adjust to local soil test results.', 'تم الإنشاء بواسطة Formula Atlas — مولّد التسميد. المعدلات الافتراضية مبنية على أبحاث؛ اضبطها دائماً وفق نتائج تحليل التربة المحلي.')}
      </p>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [crop, areaHa, plantingDate, scaledApps, totals, language]);

  const handleCopy = useCallback(() => {
    const lines = [
      '=== FERTILIZATION PLAN ===',
      `${crop.emoji} ${crop.name}`,
      `Field area: ${areaHa} ha`,
      `Planting date: ${plantingDate}`,
      `Season: ${crop.seasonLength} days (${crop.stages.length} stages)`,
      '',
      `Season totals (${areaHa} ha):`,
      `N: ${totals.n.toFixed(1)} kg`,
      `P: ${totals.p.toFixed(1)} kg`,
      `K: ${totals.k.toFixed(1)} kg`,
      `Ca: ${totals.ca.toFixed(1)} kg`,
      `Mg: ${totals.mg.toFixed(1)} kg`,
      `S: ${totals.s.toFixed(1)} kg`,
      `Applications: ${scaledApps.length}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  }, [crop, areaHa, plantingDate, totals, scaledApps, language]);

  const handleReset = useCallback(() => {
    setCropId('maize');
    setAreaHa(1);
    setPlantingDate(new Date().toISOString().slice(0, 10));
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  }, [language]);

  return (
    <CalculatorShell
      icon={FlaskConical}
      title={TITLE}
      description={DESC}
      badge="FAO-56 · 20 crops"
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <div className="lg:col-span-12 space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label>
            <select
              value={cropId}
              onChange={e => setCropId(e.target.value)}
              aria-label={copyFor(language, 'Crop', 'المحصول')}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CROP_LIFECYCLES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Field area (hectares)', 'مساحة الحقل (هكتار)')}</Label>
            <Input
              type="number" min={0.1} step={0.1}
              value={areaHa}
              onChange={e => setAreaHa(Math.max(0.1, parseFloat(e.target.value) || 1))}
              aria-label={copyFor(language, 'Field area in hectares', 'مساحة الحقل بالهكتار')}
              className="mt-1 h-10 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Planting date', 'تاريخ الزراعة')}</Label>
            <Input
              type="date"
              value={plantingDate}
              onChange={e => setPlantingDate(e.target.value)}
              aria-label={copyFor(language, 'Planting date', 'تاريخ الزراعة')}
              className="mt-1 h-10 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Climate', 'المناخ')}</Label>
            <div className="mt-1 flex min-h-10 items-center rounded-md border bg-muted/40 px-3 text-xs leading-relaxed text-muted-foreground">{crop.climate}</div>
          </div>
        </div>

        {/* Stage chips */}
        <div className="rounded-xl border bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            {copyFor(language, 'Crop lifecycle stages', 'مراحل دورة حياة المحصول')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {crop.stages.map(s => (
              <Badge key={s.name} variant="outline" className="min-h-7 px-2 text-[10px]">
                {s.emoji} {s.name}
                <span className="ml-1 text-muted-foreground">D{s.startDay}–{s.endDay} · Kc {s.kc}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Season totals */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{copyFor(language, 'Season totals', 'إجماليات الموسم')}</span>
            <span className="font-mono normal-case tracking-normal text-emerald-700 dark:text-emerald-300">{areaHa} ha</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
            <NutrientTotal label="N" value={totals.n} unit="kg" color="emerald" />
            <NutrientTotal label="P" value={totals.p} unit="kg" color="indigo" />
            <NutrientTotal label="K" value={totals.k} unit="kg" color="amber" />
            <NutrientTotal label="Ca" value={totals.ca} unit="kg" color="cyan" />
            <NutrientTotal label="Mg" value={totals.mg} unit="kg" color="violet" />
            <NutrientTotal label="S" value={totals.s} unit="kg" color="yellow" />
          </div>
          {(totals.b + totals.zn + totals.mn + totals.fe + totals.cu) > 0 && (
            <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/50 text-[10px] text-muted-foreground">
              <strong className="text-emerald-700 dark:text-emerald-300">{copyFor(language, 'Micronutrients (g):', 'العناصر الصغرى (غ):')}</strong>{' '}
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
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-3 w-3" /> {copyFor(language, 'Application schedule', 'جدول التطبيقات')} ({scaledApps.length} {copyFor(language, 'events', 'تطبيقات')})
          </div>
          {scaledApps.map((a, i) => {
            const stage = stageForDay(crop, Math.max(1, a.day));
            return (
              <div key={i} className="rounded-xl border bg-background p-3 shadow-sm transition-colors hover:border-emerald-300 dark:hover:border-emerald-800">
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
                  <strong className="text-foreground">{copyFor(language, 'Sources:', 'المصادر:')}</strong>{' '}
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
        <Button size="sm" onClick={exportPdf} className="h-11 w-full gap-2">
          <Download className="h-3.5 w-3.5" /> {copyFor(language, 'Export fertilization plan (PDF)', 'تصدير خطة التسميد (PDF)', 'Exporter le plan de fertilisation (PDF)')}
        </Button>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          <div>{crop.notes}</div>
        </div>
      </div>
    </CalculatorShell>
  );
}

// ============================================================================
// Application timeline (Gantt-style SVG)
// ============================================================================

function ApplicationTimeline({ crop, apps }: { crop: CropLifecycle; apps: (FertilizationApplication & { dateOffset: string })[] }) {
  const { language } = useTranslation();
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
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        {copyFor(language, 'Application timeline', 'الخط الزمني للتطبيقات')}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={copyFor(language, 'Fertilization timeline', 'الخط الزمني للتسميد')}>
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
            {copyFor(language, m.replace(/_/g, ' '), ({ broadcast: 'نثر', band: 'شرائط', side_dress: 'تسميد جانبي', fertigation: 'تسميد عبر الري', foliar: 'رش ورقي', seed_treatment: 'معاملة البذور' } as Record<string, string>)[m] || m.replace(/_/g, ' '))}
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
