'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw, Plus, Trash2, Download, Copy, Check, RotateCcw,
  AlertTriangle, Sparkles, ChevronRight,
} from 'lucide-react';
import {
  ROTATION_CROPS, analyzeRotation, suggestRotation, type RotationYear,
} from '@/lib/rotation-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const COLORS: Record<string, string> = {
  cereal: '#f59e0b', legume: '#16a34a', root: '#ea580c', fruit: '#dc2626',
  leafy: '#0891b2', industrial: '#7c3aed', cover: '#0ea5e9',
};

const TITLE: TrilingualString = {
  en: 'Crop Rotation Planner',
  ar: 'مخطط دوران المحاصيل',
  fr: 'Planificateur de Rotation des Cultures',
};

const DESC: TrilingualString = {
  en: 'Multi-year rotation with N credit tracking, disease break checks, and cover crop integration.',
  ar: 'دوران محاصيل متعدد السنوات مع تتبع ائتمان النيتروجين وفحوصات فترات الأمراض ودمج المحاصيل الغطائية.',
  fr: 'Rotation pluriannuelle avec suivi du crédit N, vérifications des ruptures de maladie et intégration des cultures intermédiaires.',
};

export function CropRotationPlanner() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [rotation, setRotation] = useState<RotationYear[]>([
    { year: 1, cropId: 'soybean', isCoverCrop: false },
    { year: 2, cropId: 'maize', isCoverCrop: false },
    { year: 3, cropId: 'vetch', isCoverCrop: true },
    { year: 4, cropId: 'maize', isCoverCrop: false },
    { year: 5, cropId: 'wheat', isCoverCrop: false },
  ]);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => analyzeRotation(rotation), [rotation]);

  const updateCrop = (index: number, cropId: string) => {
    const crop = ROTATION_CROPS.find(c => c.id === cropId);
    const newRot = [...rotation];
    newRot[index] = { ...newRot[index], cropId, isCoverCrop: crop?.type === 'cover' };
    setRotation(newRot);
  };

  const addYear = () => setRotation([...rotation, { year: rotation.length + 1, cropId: 'rye', isCoverCrop: true }]);
  const removeYear = (i: number) => setRotation(rotation.filter((_, idx) => idx !== i).map((ry, idx) => ({ ...ry, year: idx + 1 })));

  const autoSuggest = (primary: string) => {
    const suggested = suggestRotation(primary, rotation.length || 5);
    if (suggested.length > 0) setRotation(suggested);
  };

  const handleReset = () => {
    setRotation([
      { year: 1, cropId: 'soybean', isCoverCrop: false },
      { year: 2, cropId: 'maize', isCoverCrop: false },
      { year: 3, cropId: 'vetch', isCoverCrop: true },
      { year: 4, cropId: 'maize', isCoverCrop: false },
      { year: 5, cropId: 'wheat', isCoverCrop: false },
    ]);
    toast({ title: tr('Rotation reset to default', 'أُعيد التدوير إلى الافتراضي', 'Rotation réinitialisée') });
  };

  const exportPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const yearRows = rotation.map(ry => {
      const crop = ROTATION_CROPS.find(c => c.id === ry.cropId);
      return `<tr><td style="text-align:center">${ry.year}</td><td>${crop?.emoji} ${crop?.name}</td><td style="text-transform:capitalize">${crop?.type}</td><td style="text-align:right">${crop?.nDemand || 0}</td><td style="text-align:right">${crop?.nCreditNext || 0}</td><td style="text-align:right">${crop?.omContribution || 0}</td></tr>`;
    }).join('');
    const recs = analysis.recommendations.map(r => `<li>${r}</li>`).join('');
    const warnings = analysis.diseaseWarnings.map(w => `<li style="color:#dc2626">${w}</li>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Crop Rotation Plan</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#16a34a;font-size:20px}
      .meta{color:#475569;font-size:12px;margin-bottom:16px}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
      .stat{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px} .stat-label{font-size:10px;color:#16a34a;text-transform:uppercase} .stat-value{font-size:18px;font-weight:bold}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px} th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left} td{padding:4px 6px;border:1px solid #d1fae5}
      ul{font-size:12px} @page{size:portrait;margin:12mm}
    </style></head><body>
      <h1>🔄 Crop Rotation Plan</h1>
      <div class="meta">${rotation.length}-year rotation · Generated: ${new Date().toLocaleString()}</div>
      <div class="summary">
        <div class="stat"><div class="stat-label">Soil Health Score</div><div class="stat-value">${analysis.soilHealthScore}/100</div></div>
        <div class="stat"><div class="stat-label">N Credit</div><div class="stat-value">${analysis.totalNCredit} kg/ha</div></div>
        <div class="stat"><div class="stat-label">N Fertilizer Saved</div><div class="stat-value">${analysis.nFertilizerSaved} kg/ha</div></div>
        <div class="stat"><div class="stat-label">OM Added</div><div class="stat-value">${analysis.totalOmAdded} t/ha</div></div>
      </div>
      <table><thead><tr><th>Year</th><th>Crop</th><th>Type</th><th>N Demand (kg/ha)</th><th>N Credit Next (kg/ha)</th><th>OM Added (t/ha)</th></tr></thead><tbody>${yearRows}</tbody></table>
      ${warnings ? `<h2>⚠️ Disease Warnings</h2><ul>${warnings}</ul>` : '<p style="color:#16a34a">✅ All disease breaks satisfied.</p>'}
      <h2>Recommendations</h2><ul>${recs}</ul>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  const handleCopy = () => {
    const yearLines = rotation.map(ry => {
      const crop = ROTATION_CROPS.find(c => c.id === ry.cropId);
      return `  Y${ry.year}: ${crop?.emoji} ${crop?.name} (${crop?.type}) — N demand ${crop?.nDemand}, credit +${crop?.nCreditNext}`;
    }).join('\n');
    const text = `=== CROP ROTATION PLAN ===\n${rotation.length}-year rotation\n\n${yearLines}\n\nSoil Health: ${analysis.soilHealthScore}/100\nN Credit: ${analysis.totalNCredit} kg/ha\nN Fertilizer Saved: ${analysis.nFertilizerSaved} kg/ha\nOM Added: ${analysis.totalOmAdded} t/ha\nCash crops: ${analysis.cashCropYears} · Legumes: ${analysis.legumeYears} · Cover crops: ${analysis.coverCropYears}\n\nDisease warnings: ${analysis.diseaseWarnings.length}\n${analysis.diseaseWarnings.map(w => `  ⚠️ ${w}`).join('\n')}\n\nRecommendations:\n${analysis.recommendations.map(r => `  • ${r}`).join('\n')}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={RefreshCw}
      title={TITLE}
      description={DESC}
      badge="5-Year Cycle"
      accent="emerald"
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
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
        {
          icon: Download,
          label: { en: 'PDF', ar: 'بي دي إف', fr: 'PDF' },
          onClick: exportPdf,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              {tr('Rotation Builder', 'بناء التدوير', 'Constructeur de rotation')}
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">
              {rotation.length} {tr('years', 'سنوات', 'ans')}
            </span>
          </div>

          {/* Auto-suggest bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/15">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tr('Auto-suggest', 'اقتراح تلقائي', 'Auto-suggérer')}</span>
            {['maize', 'wheat', 'tomato', 'potato', 'cotton'].map(c => {
              const crop = ROTATION_CROPS.find(cr => cr.id === c);
              if (!crop) return null;
              return (
                <Button key={c} size="sm" variant="outline" onClick={() => autoSuggest(c)} className="h-7 text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" /> {crop.emoji} {crop.name}
                </Button>
              );
            })}
            <Button size="sm" variant="outline" onClick={addYear} className="h-7 text-[10px] gap-1 sm:ml-auto">
              <Plus className="h-3 w-3" /> {tr('Add Year', 'أضف سنة', 'Ajouter année')}
            </Button>
          </div>

          {/* Composition badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">💰 {tr('Cash crops', 'محاصيل نقدية', 'Cash crops')}: {analysis.cashCropYears}</Badge>
            <Badge variant="outline" className="text-[10px] text-green-700 dark:text-green-400">🫘 {tr('Legumes', 'بقوليات', 'Légumineuses')}: {analysis.legumeYears}</Badge>
            <Badge variant="outline" className="text-[10px] text-blue-700 dark:text-blue-400">🌱 {tr('Cover crops', 'محاصيل غطائية', 'Cultures intermédiaires')}: {analysis.coverCropYears}</Badge>
            <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400">🌿 {tr('OM added', 'مادة عضوية مضافة', 'MO ajoutée')}: {analysis.totalOmAdded} t/ha</Badge>
          </div>

          {/* Disease warnings */}
          {analysis.diseaseWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> {tr('Disease Break Warnings', 'تحذيرات فترات الأمراض', 'Alertes ruptures de maladie')} ({analysis.diseaseWarnings.length})
              </div>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {analysis.diseaseWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Rotation Scorecard', 'بطاقة التدوير', 'Tableau de bord rotation')}
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">
              {analysis.soilHealthScore}/100
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile
              label={tr('Soil Health', 'صحة التربة', 'Santé sol')}
              value={`${analysis.soilHealthScore}`}
              unit="/100"
              color={analysis.soilHealthScore >= 75 ? 'emerald' : analysis.soilHealthScore >= 50 ? 'amber' : 'rose'}
            />
            <CalculatorShell.MetricTile
              label={tr('N Credit', 'ائتمان النيتروجين', 'Crédit N')}
              value={`${analysis.totalNCredit}`}
              unit="kg/ha"
              color="emerald"
              helper={tr('from legumes + covers', 'من البقوليات والغطائيات', 'des légumineuses + couverts')}
            />
            <CalculatorShell.MetricTile
              label={tr('N Saved', 'النيتروجين الموفّر', 'N économisé')}
              value={`${analysis.nFertilizerSaved}`}
              unit="kg/ha"
              color="teal"
              helper={`~$${Math.round(analysis.nFertilizerSaved * 0.8)}/ha`}
            />
            <CalculatorShell.MetricTile
              label={tr('OM Added', 'مادة عضوية مضافة', 'MO ajoutée')}
              value={`${analysis.totalOmAdded}`}
              unit="t/ha"
              color="amber"
              helper={tr('over rotation', 'عبر التدوير', 'sur la rotation')}
            />
          </div>

          {/* Soil health gauge */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{tr('Soil Health Score', 'درجة صحة التربة', 'Score de santé sol')}</span>
              <span className="text-sm font-bold" style={{ color: analysis.soilHealthScore >= 75 ? '#16a34a' : analysis.soilHealthScore >= 50 ? '#f59e0b' : '#dc2626' }}>
                {analysis.soilHealthScore}/100
              </span>
            </div>
            <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 overflow-hidden relative">
              <div className="absolute top-0 bottom-0 w-1 bg-white shadow" style={{ left: `${analysis.soilHealthScore}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{tr('Poor', 'ضعيف', 'Faible')}</span>
              <span>{tr('Moderate', 'متوسط', 'Modéré')}</span>
              <span>{tr('Excellent', 'ممتاز', 'Excellent')}</span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> {tr('AI Rotation Recommendations', 'توصيات التدوير الذكية', 'Recommandations IA de rotation')}
            </div>
            <ul className="text-xs space-y-1 list-disc pl-4">
              {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      </CalculatorShell.Results>

      {/* Rotation timeline — full width */}
      <div className="lg:col-span-12 p-4 rounded-2xl border bg-card shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-base font-bold flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-600" />
            {tr('Rotation Timeline', 'الجدول الزمني للتدوير', 'Chronologie de rotation')} ({rotation.length} {tr('years', 'سنوات', 'ans')})
          </span>
        </div>

        {/* Timeline visualization */}
        <div className="flex snap-x gap-2 overflow-x-auto pb-3">
          {rotation.map((ry, i) => {
            const crop = ROTATION_CROPS.find(c => c.id === ry.cropId);
            if (!crop) return null;
            const color = COLORS[crop.type] || '#64748b';
            const prevCrop = i > 0 ? ROTATION_CROPS.find(c => c.id === rotation[i - 1].cropId) : null;
            const nCredit = prevCrop?.nCreditNext || 0;
            return (
              <div key={i} className="flex items-center gap-1 flex-shrink-0">
                {/* N credit arrow */}
                {nCredit > 0 && (
                  <div className="flex flex-col items-center text-[8px] text-emerald-600 dark:text-emerald-400" title={`+${nCredit} kg N/ha from ${prevCrop?.name}`}>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-mono">+{nCredit}</span>
                  </div>
                )}
                {/* Year card */}
                <div className="min-w-[112px] snap-start rounded-2xl border-2 p-3 text-center shadow-sm" style={{ borderColor: `${color}60`, background: `${color}10` }}>
                  <div className="text-[9px] text-muted-foreground font-semibold">{tr('Year', 'سنة', 'Année')} {ry.year}</div>
                  <div className="text-2xl my-0.5">{crop.emoji}</div>
                  <Select value={ry.cropId} onValueChange={v => updateCrop(i, v)}>
                    <SelectTrigger className="h-6 text-[10px] p-0 border-none bg-transparent"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROTATION_CROPS.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-[7px] mt-0.5 capitalize" style={{ color, borderColor: `${color}60` }}>{crop.type}</Badge>
                  <div className="text-[8px] text-muted-foreground mt-0.5">N: {crop.nDemand} → +{crop.nCreditNext}</div>
                  {rotation.length > 1 && <button type="button" onClick={() => removeYear(i)} aria-label={`Remove year ${ry.year}`} className="mt-1 inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CalculatorShell>
  );
}
