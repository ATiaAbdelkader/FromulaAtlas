'use client';

import { useState, type ReactNode } from 'react';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Sparkles, AlertCircle, CalendarDays, Copy, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

interface WeekPlan {
  week: number; stage: string; kc: number; n: number; p: number; k: number;
  irrigation: number; fertigation: string; notes: string;
}
interface SeasonPlan {
  crop: string; plantingDate: string; fieldAreaHa?: number; targetYield?: string;
  totalSeason?: { n: number; p: number; k: number; irrigationM3: number };
  weeks: WeekPlan[];
  warnings?: string[];
  aiSummary?: string;
}

const STAGE_COLORS: Record<string, string> = {
  establishment: '#94a3b8', vegetative: '#16a34a', flowering: '#d97706',
  filling: '#0891b2', maturation: '#7c3aed',
};

const TITLE: TrilingualString = {
  en: 'Season Plan Generator',
  ar: 'مولّد خطة الموسم',
  fr: 'Générateur de plan de saison',
};

const DESC: TrilingualString = {
  en: 'Generate a 52-week agronomic plan: NPK demand, irrigation, fertigation, and management notes per week.',
  ar: 'أنشئ خطة زراعية لمدة 52 أسبوعاً: احتياج NPK والري والتسميد عبر الري وملاحظات الإدارة لكل أسبوع.',
  fr: "Générez un plan agronomique de 52 semaines : besoins NPK, irrigation, fertigation et notes de gestion par semaine.",
};

export function SeasonPlanGenerator({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [crop, setCrop] = useState('tomato');
  const [plantingDate, setPlantingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fieldAreaHa, setFieldAreaHa] = useState('1');
  const [targetYield, setTargetYield] = useState('80 t/ha');
  const [soil, setSoil] = useState({ ph: '6.5', om: '2.5', cec: '15', ca: '8', mg: '2', k: '0.4', texture: 'loam' });
  const [water, setWater] = useState({ ph: '7.2', ec: '0.8', hco3: '0.5', hardness: 'moderately hard' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SeasonPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const { isRTL, language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const generate = async () => {
    setLoading(true); setError(null); setPlan(null);
    try {
      const res = await fetch('/api/season-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop, plantingDate,
          fieldAreaHa: parseFloat(fieldAreaHa) || 1,
          targetYield,
          soil: {
            ph: parseFloat(soil.ph) || 0, om: parseFloat(soil.om) || 0,
            cec: parseFloat(soil.cec) || 0, ca: parseFloat(soil.ca) || 0,
            mg: parseFloat(soil.mg) || 0, k: parseFloat(soil.k) || 0,
            texture: soil.texture,
          },
          water: {
            ph: parseFloat(water.ph) || 0, ec: parseFloat(water.ec) || 0,
            hco3: parseFloat(water.hco3) || 0, hardness: water.hardness,
          },
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: tr('Request failed', 'فشل الطلب', 'Échec de la requête') }));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data: SeasonPlan = await res.json();
      if (!Array.isArray(data.weeks) || data.weeks.length === 0) {
        throw new Error(tr('Plan did not return any weeks', 'لم تُرجِع الخطة أي أسابيع', 'Le plan n\'a renvoyé aucune semaine'));
      }
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Failed to generate plan', 'تعذّر إنشاء الخطة', 'Échec de génération du plan'));
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!plan) return;
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) {
      setError(tr(
        'Pop-up blocked — please allow pop-ups for this site to download the PDF.',
        'تم حظر النافذة المنبثقة — اسمح بالنوافذ المنبثقة لهذا الموقع لتنزيل ملف PDF.',
        'Pop-up bloqué — autorisez les pop-ups pour télécharger le PDF.',
      ));
      return;
    }
    w.document.write(buildPrintHtml(plan, language));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const reset = () => {
    setCrop('tomato');
    setPlantingDate(new Date().toISOString().slice(0, 10));
    setFieldAreaHa('1');
    setTargetYield('80 t/ha');
    setSoil({ ph: '6.5', om: '2.5', cec: '15', ca: '8', mg: '2', k: '0.4', texture: 'loam' });
    setWater({ ph: '7.2', ec: '0.8', hco3: '0.5', hardness: 'moderately hard' });
    setError(null);
    setPlan(null);
    toast({ title: tr('Form reset', 'تمت إعادة التعيين', 'Formulaire réinitialisé') });
  };

  const handleCopy = () => {
    if (!plan) {
      toast({ title: tr('Generate a plan first', 'أنشئ خطة أولاً', 'Générez d\'abord un plan') });
      return;
    }
    const ts = plan.totalSeason;
    const lines: string[] = [];
    lines.push('=== SEASON PLAN ===');
    lines.push(`Crop: ${plan.crop}`);
    lines.push(`Planting: ${plan.plantingDate} · Area: ${plan.fieldAreaHa ?? '—'} ha · Target: ${plan.targetYield ?? '—'}`);
    if (ts) {
      lines.push(`Season totals: N ${ts.n?.toFixed(0)} · P ${ts.p?.toFixed(0)} · K ${ts.k?.toFixed(0)} kg/ha · ${ts.irrigationM3?.toFixed(0)} m³/ha`);
    }
    if (plan.aiSummary) lines.push('', 'AI summary:', plan.aiSummary);
    if (plan.warnings?.length) {
      lines.push('', 'Warnings:');
      plan.warnings.forEach(w => lines.push(`- ${w}`));
    }
    lines.push('', 'Weekly plan:');
    plan.weeks.forEach(w => {
      lines.push(`Wk ${w.week} [${w.stage}]: Kc ${w.kc?.toFixed(2) ?? '—'} · N ${w.n?.toFixed(1) ?? '—'} · P ${w.p?.toFixed(1) ?? '—'} · K ${w.k?.toFixed(1) ?? '—'} kg/ha · ${w.irrigation?.toFixed(0) ?? '—'} m³/ha · ${w.fertigation || '—'}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Plan copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="!max-w-[1100px] w-[96vw] !max-h-[92vh] h-[92vh] overflow-hidden rounded-2xl border-violet-200/70 p-0 gap-0 flex flex-col shadow-2xl dark:border-violet-900/60">
        {/* sr-only dialog header for accessibility — visible header is in CalculatorShell */}
        <DialogHeader className="sr-only">
          <DialogTitle>{tr('Season Plan Generator', 'مولّد خطة الموسم', 'Générateur de plan de saison')}</DialogTitle>
          <DialogDescription>{tr(DESC.en, DESC.ar, DESC.fr)}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <CalculatorShell
            icon={CalendarDays}
            title={TITLE}
            description={DESC}
            badge="Pro"
            accent="violet"
            actions={[
              {
                icon: Copy,
                label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier le résumé' },
                onClick: handleCopy,
                variant: 'primary',
                showCheck: copied,
              },
              {
                icon: RotateCcw,
                label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
                onClick: reset,
              },
            ]}
          >
            <div className="lg:col-span-12 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label={tr('Crop', 'المحصول', 'Culture')}><Input value={crop} onChange={e => setCrop(e.target.value)} className="h-10 sm:h-9" /></Field>
                <Field label={tr('Planting date', 'تاريخ الزراعة', 'Date de plantation')}><Input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="h-10 sm:h-9" /></Field>
                <Field label={tr('Field area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')}><Input type="number" value={fieldAreaHa} onChange={e => setFieldAreaHa(e.target.value)} className="h-10 sm:h-9" /></Field>
                <Field label={tr('Target yield', 'الإنتاجية المستهدفة', 'Rendement cible')}><Input value={targetYield} onChange={e => setTargetYield(e.target.value)} className="h-10 sm:h-9" /></Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                  <div className="text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-300 font-semibold mb-2">{tr('Soil summary', 'ملخّص التربة', 'Résumé du sol')}</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Field label="pH"><Input value={soil.ph} onChange={e => setSoil({ ...soil, ph: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label="OM %"><Input value={soil.om} onChange={e => setSoil({ ...soil, om: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label="CEC"><Input value={soil.cec} onChange={e => setSoil({ ...soil, cec: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label={tr('Texture', 'القوام', 'Texture')}><Input value={soil.texture} onChange={e => setSoil({ ...soil, texture: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label={tr('Ca meq', 'Ca ميلي مكافئ', 'Ca meq')}><Input value={soil.ca} onChange={e => setSoil({ ...soil, ca: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label={tr('Mg meq', 'Mg ميلي مكافئ', 'Mg meq')}><Input value={soil.mg} onChange={e => setSoil({ ...soil, mg: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label={tr('K meq', 'K ميلي مكافئ', 'K meq')}><Input value={soil.k} onChange={e => setSoil({ ...soil, k: e.target.value })} className="h-10 sm:h-9" /></Field>
                  </div>
                </div>
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 dark:border-cyan-900 dark:bg-cyan-950/20">
                  <div className="text-[10px] uppercase tracking-wide text-cyan-700 dark:text-cyan-300 font-semibold mb-2">{tr('Irrigation water summary', 'ملخّص مياه الري', 'Résumé eau d\'irrigation')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="pH"><Input value={water.ph} onChange={e => setWater({ ...water, ph: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label="EC (dS/m)"><Input value={water.ec} onChange={e => setWater({ ...water, ec: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label="HCO₃⁻ (meq/L)"><Input value={water.hco3} onChange={e => setWater({ ...water, hco3: e.target.value })} className="h-10 sm:h-9" /></Field>
                    <Field label={tr('Hardness', 'العسر', 'Dureté')}><Input value={water.hardness} onChange={e => setWater({ ...water, hardness: e.target.value })} className="h-10 sm:h-9" /></Field>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={generate} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
                  {loading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {tr('Generating 52-week plan…', 'جارٍ إنشاء خطة 52 أسبوعاً…', 'Génération du plan 52 semaines…')}</>
                    : <><Sparkles className="h-4 w-4 mr-2" /> {tr('Generate 52-week plan', 'إنشاء خطة 52 أسبوعاً', 'Générer le plan 52 semaines')}</>}
                </Button>
                {plan && !loading && (
                  <Button variant="outline" onClick={downloadPdf} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" /> {tr('Download PDF', 'تنزيل PDF', 'Télécharger PDF')}
                  </Button>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl p-4 border border-destructive/30">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {plan && plan.weeks.length > 0 && (
                <>
                  {/* AI executive summary */}
                  {plan.aiSummary && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-300 font-semibold mb-1.5">
                        <Sparkles className="h-3 w-3" /> {tr('AI Executive Summary', 'الملخّص التنفيذي بالذكاء الاصطناعي', 'Résumé exécutif IA')}
                      </div>
                      <p className="text-xs leading-relaxed text-foreground">{plan.aiSummary}</p>
                    </div>
                  )}

                  {/* Soil/water warnings */}
                  {plan.warnings && plan.warnings.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold mb-1.5">
                        <AlertCircle className="h-3 w-3" /> {tr('Soil & Water Warnings', 'تحذيرات التربة والمياه', 'Avertissements sol & eau')} ({plan.warnings.length})
                      </div>
                      <ul className="text-xs leading-relaxed text-foreground space-y-0.5 list-disc pl-4">
                        {plan.warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  <PlanTable plan={plan} language={language} />
                </>
              )}
            </div>
          </CalculatorShell>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlanTable({ plan, language }: { plan: SeasonPlan; language: Language }) {
  const ts = plan.totalSeason;
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-3">
        <div className="text-sm font-semibold">{copyFor(language, '52-week plan', 'خطة 52 أسبوعاً', 'Plan 52 semaines')}: {plan.crop}</div>
        <Badge variant="outline" className="text-[10px]">{plan.weeks.length} {copyFor(language, 'weeks', 'أسبوع', 'semaines')}</Badge>
        {ts && (
          <Badge variant="outline" className="text-[10px] text-violet-700 dark:text-violet-300">
            Σ N {ts.n?.toFixed(0)} · P {ts.p?.toFixed(0)} · K {ts.k?.toFixed(0)} kg/ha · {ts.irrigationM3?.toFixed(0)} m³/ha
          </Badge>
        )}
        <div className="ml-auto flex flex-wrap gap-1.5 text-[10px]">
          {Object.entries(STAGE_COLORS).map(([s, c]) => (
              <span key={s} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border">
              <span className="w-2 h-2 rounded-full" style={{ background: c }} />{stageLabel(s, language)}
            </span>
          ))}
        </div>
      </div>
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="text-[10px] uppercase text-muted-foreground bg-muted/30 sticky top-0">
            <tr className="border-b">
              <th className="py-1.5 px-2 text-left">{copyFor(language, 'Wk', 'أسبوع', 'Sem.')}</th>
              <th className="py-1.5 px-2 text-left">{copyFor(language, 'Stage', 'المرحلة', 'Stade')}</th>
              <th className="py-1.5 px-2 text-right">Kc</th>
              <th className="py-1.5 px-2 text-right">N</th>
              <th className="py-1.5 px-2 text-right">P</th>
              <th className="py-1.5 px-2 text-right">K</th>
              <th className="py-1.5 px-2 text-right">{copyFor(language, 'Irrig m³/ha', 'ري م³/هكتار', 'Irrig m³/ha')}</th>
              <th className="py-1.5 px-2 text-left">{copyFor(language, 'Fertigation', 'التسميد عبر الري', 'Fertigation')}</th>
              <th className="py-1.5 px-2 text-left">{copyFor(language, 'Notes', 'ملاحظات', 'Notes')}</th>
            </tr>
          </thead>
          <tbody>
            {plan.weeks.map(w => (
              <tr key={w.week} className="border-b last:border-0 hover:bg-violet-50/40 dark:hover:bg-violet-950/20">
                <td className="py-1.5 px-2 font-mono">{w.week}</td>
                <td className="py-1.5 px-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[w.stage] || '#94a3b8' }} />
                    {stageLabel(w.stage, language)}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right font-mono">{w.kc?.toFixed(2) ?? '—'}</td>
                <td className="py-1.5 px-2 text-right font-mono">{w.n?.toFixed(1) ?? '—'}</td>
                <td className="py-1.5 px-2 text-right font-mono">{w.p?.toFixed(1) ?? '—'}</td>
                <td className="py-1.5 px-2 text-right font-mono">{w.k?.toFixed(1) ?? '—'}</td>
                <td className="py-1.5 px-2 text-right font-mono">{w.irrigation?.toFixed(0) ?? '—'}</td>
                <td className="py-1.5 px-2 text-[11px] text-muted-foreground max-w-[180px] truncate" title={w.fertigation}>{w.fertigation || '—'}</td>
                <td className="py-1.5 px-2 text-[11px] text-muted-foreground max-w-[280px] truncate" title={w.notes}>{w.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function stageLabel(stage: string, language: Language): string {
  const labels: Record<string, string> = {
    establishment: copyFor(language, 'Establishment', 'التأسيس', 'Établissement'),
    vegetative: copyFor(language, 'Vegetative', 'النمو الخضري', 'Végétatif'),
    flowering: copyFor(language, 'Flowering', 'الإزهار', 'Floraison'),
    filling: copyFor(language, 'Filling', 'امتلاء الثمار', 'Grossissement'),
    maturation: copyFor(language, 'Maturation', 'النضج', 'Maturation'),
  };
  return labels[stage] ?? stage;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
}

function buildPrintHtml(plan: SeasonPlan, language: Language): string {
  const rows = plan.weeks.map(w => `<tr><td>${w.week}</td><td>${escapeHtml(stageLabel(w.stage, language))}</td><td style="text-align:right">${w.kc?.toFixed(2) ?? ''}</td><td style="text-align:right">${w.n?.toFixed(1) ?? ''}</td><td style="text-align:right">${w.p?.toFixed(1) ?? ''}</td><td style="text-align:right">${w.k?.toFixed(1) ?? ''}</td><td style="text-align:right">${w.irrigation?.toFixed(0) ?? ''}</td><td>${escapeHtml(w.fertigation || '—')}</td><td>${escapeHtml(w.notes || '—')}</td></tr>`).join('');
  const title = copyFor(language, 'Season Plan', 'خطة الموسم', 'Plan de saison');
  const planting = copyFor(language, 'Planting', 'الزراعة', 'Plantation');
  const target = copyFor(language, 'Target yield', 'الإنتاجية المستهدفة', 'Rendement cible');
  const field = copyFor(language, 'Field', 'الحقل', 'Champ');
  const generated = copyFor(language, 'Generated', 'تاريخ الإنشاء', 'Généré');
  const stage = copyFor(language, 'Stage', 'المرحلة', 'Stade');
  const irrig = copyFor(language, 'Irrig m³/ha', 'ري م³/هكتار', 'Irrig m³/ha');
  const fertigation = copyFor(language, 'Fertigation', 'التسميد عبر الري', 'Fertigation');
  const notes = copyFor(language, 'Notes', 'ملاحظات', 'Notes');
  return `<!DOCTYPE html><html dir="${language === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${title} — ${escapeHtml(plan.crop)}</title><style>body{font-family:-apple-system,system-ui,sans-serif;margin:24px;color:#0f172a}h1{color:#7c3aed;font-size:20px;margin:0 0 4px}.meta{color:#475569;font-size:12px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#f5f3ff;color:#7c3aed;text-align:start;padding:6px;border:1px solid #ddd6fe}td{padding:4px 6px;border:1px solid #ede9fe;vertical-align:top}tr:nth-child(even) td{background:#faf5ff}@page{size:landscape;margin:12mm}</style></head><body><h1>${title} — ${escapeHtml(plan.crop)}</h1><div class="meta">${planting}: ${escapeHtml(plan.plantingDate)} · ${target}: ${escapeHtml(plan.targetYield ?? '—')} · ${field}: ${plan.fieldAreaHa ?? '—'} ha · ${generated} ${new Date().toISOString().slice(0, 10)}</div><table><thead><tr><th>#</th><th>${stage}</th><th>Kc</th><th>N kg/ha</th><th>P kg/ha</th><th>K kg/ha</th><th>${irrig}</th><th>${fertigation}</th><th>${notes}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}
