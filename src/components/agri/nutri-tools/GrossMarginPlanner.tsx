'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Download, Plus, RefreshCw, Scale, Trash2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation } from '@/lib/language-store';
import { costPerHaFromEntries, calculateGrossMarginPortfolio, type GrossMarginScenarioInput } from '@/lib/gross-margin-planner';
import { getEntries } from '@/lib/financial-store';

interface ScenarioDraft extends GrossMarginScenarioInput {
  actualYieldText: string;
  actualPriceText: string;
}

const CROPS = [
  { id: 'maize', en: 'Maize', ar: 'ذرة', fr: 'Maïs', emoji: '🌽' },
  { id: 'wheat', en: 'Wheat', ar: 'قمح', fr: 'Blé', emoji: '🌾' },
  { id: 'tomato', en: 'Tomato', ar: 'طماطم', fr: 'Tomate', emoji: '🍅' },
  { id: 'potato', en: 'Potato', ar: 'بطاطا', fr: 'Pomme de terre', emoji: '🥔' },
  { id: 'cotton', en: 'Cotton', ar: 'قطن', fr: 'Coton', emoji: '🌱' },
];

const DEFAULT_SCENARIOS: ScenarioDraft[] = [
  { id: 'scenario-1', crop: 'maize', areaHa: 5, expectedYieldTPerHa: 8, expectedPricePerT: 220, variableCostPerHa: 760, fixedCostPerHa: 300, otherRevenuePerHa: 0, actualYieldText: '', actualPriceText: '' },
  { id: 'scenario-2', crop: 'wheat', areaHa: 4, expectedYieldTPerHa: 5.5, expectedPricePerT: 280, variableCostPerHa: 520, fixedCostPerHa: 280, otherRevenuePerHa: 0, actualYieldText: '', actualPriceText: '' },
];

const STATUS_STYLES = {
  profitable: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20',
  breakEven: 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20',
  loss: 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20',
};

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function GrossMarginPlanner() {
  const { language, isRTL } = useTranslation();
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>(DEFAULT_SCENARIOS);
  const [savedBaseline, setSavedBaseline] = useState<number | null>(null);
  const portfolio = useMemo(() => calculateGrossMarginPortfolio(scenarios.map(({ actualYieldText, actualPriceText, ...scenario }) => ({
    ...scenario,
    actualYieldTPerHa: actualYieldText === '' ? undefined : numberValue(actualYieldText),
    actualPricePerT: actualPriceText === '' ? undefined : numberValue(actualPriceText),
  }))), [scenarios]);
  const tr = (english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);

  const cropLabel = (cropId: string) => {
    const crop = CROPS.find(item => item.id === cropId);
    return crop ? `${crop.emoji} ${language === 'ar' ? crop.ar : language === 'fr' ? crop.fr : crop.en}` : cropId;
  };

  function updateScenario(id: string, patch: Partial<ScenarioDraft>) {
    setScenarios(current => current.map(scenario => scenario.id === id ? { ...scenario, ...patch } : scenario));
  }

  function addScenario() {
    const index = scenarios.length + 1;
    setScenarios(current => [...current, { ...DEFAULT_SCENARIOS[0], id: `scenario-${Date.now()}`, crop: 'tomato', areaHa: 1, actualYieldText: '', actualPriceText: '' }]);
    void index;
  }

  function removeScenario(id: string) {
    if (scenarios.length <= 1) return;
    setScenarios(current => current.filter(scenario => scenario.id !== id));
  }

  function loadSavedBaseline() {
    const total = costPerHaFromEntries(getEntries());
    if (total <= 0) return;
    setSavedBaseline(total);
    setScenarios(current => current.map(scenario => ({ ...scenario, variableCostPerHa: Math.round(total * 0.65), fixedCostPerHa: Math.round(total * 0.35) })));
  }

  function resetScenarios() {
    setScenarios(DEFAULT_SCENARIOS);
    setSavedBaseline(null);
  }

  function printPlan() {
    const title = tr('Gross-Margin & Break-Even Plan', 'خطة الهامش الإجمالي ونقطة التعادل', 'Plan de marge brute et de seuil de rentabilité');
    const rows = portfolio.scenarios.map(scenario => `<tr><td>${cropLabel(scenario.crop)}</td><td>${scenario.areaHa.toFixed(1)}</td><td>${scenario.totalCostPerHa.toFixed(0)}</td><td>${scenario.revenuePerHa.toFixed(0)}</td><td>${scenario.grossMarginPerHa.toFixed(0)}</td><td>${scenario.breakEvenYieldTPerHa.toFixed(2)}</td><td>${scenario.breakEvenPricePerT.toFixed(0)}</td></tr>`).join('');
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(`<!doctype html><html dir="${isRTL ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:1000px;margin:32px auto;padding:0 24px;color:#17202a;line-height:1.55}h1{color:#166534}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5e1;padding:7px;text-align:start}th{background:#ecfdf5;color:#166534}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.box{border:1px solid #bbf7d0;border-radius:8px;padding:10px;background:#f0fdf4}.label{font-size:11px;color:#64748b}.value{font-size:20px;font-weight:bold}</style></head><body><h1>${title}</h1><p>${tr('Scenario comparison for crop decisions. Values are planning estimates, not guaranteed prices or regulated financial advice.', 'مقارنة سيناريوهات لاتخاذ قرارات المحاصيل. القيم تقديرات تخطيطية وليست أسعاراً مضمونة أو نصيحة مالية منظمة.', 'Comparaison de scénarios pour les décisions culturales. Les valeurs sont des estimations de planification et non des prix garantis ni des conseils financiers réglementés.')}</p><div class="summary"><div class="box"><div class="label">${tr('Total area', 'المساحة الإجمالية', 'Surface totale')}</div><div class="value">${portfolio.totalAreaHa.toFixed(1)} ha</div></div><div class="box"><div class="label">${tr('Total gross margin', 'إجمالي الهامش الإجمالي', 'Marge brute totale')}</div><div class="value">$${portfolio.totalGrossMargin.toFixed(0)}</div></div><div class="box"><div class="label">${tr('Weighted margin', 'الهامش الموزون', 'Marge pondérée')}</div><div class="value">${portfolio.weightedMarginPct.toFixed(1)}%</div></div></div><table><thead><tr><th>${tr('Crop', 'المحصول', 'Culture')}</th><th>${tr('Area ha', 'المساحة هـ', 'Surface ha')}</th><th>${tr('Cost/ha', 'التكلفة/هـ', 'Coût/ha')}</th><th>${tr('Revenue/ha', 'الإيراد/هـ', 'Revenu/ha')}</th><th>${tr('Margin/ha', 'الهامش/هـ', 'Marge/ha')}</th><th>${tr('Break-even yield', 'إنتاج التعادل', 'Rendement seuil')}</th><th>${tr('Break-even price', 'سعر التعادل', 'Prix seuil')}</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:18px;color:#64748b;font-size:11px">${tr('Review local markets, contracts, input quotes, taxes, and financing terms before committing resources.', 'راجع الأسواق المحلية والعقود وأسعار المدخلات والضرائب وشروط التمويل قبل الالتزام بالموارد.', 'Vérifiez les marchés locaux, contrats, prix des intrants, taxes et conditions de financement avant tout engagement.')}</p></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-amber-200/70 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 via-background to-emerald-50/50 pb-4 dark:from-amber-950/30 dark:via-background dark:to-emerald-950/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4 text-amber-600" /> {tr('Gross-Margin & Break-Even Planner', 'مخطّط الهامش الإجمالي ونقطة التعادل', 'Planificateur de marge brute et de seuil de rentabilité')}</CardTitle>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tr('Compare crop choices by cost, revenue, break-even, and downside risk before committing field resources.', 'قارن خيارات المحاصيل حسب التكلفة والإيراد والتعادل ومخاطر الهبوط قبل الالتزام بموارد الحقل.', 'Comparez les cultures par coût, revenu, seuil de rentabilité et risque avant d’engager les ressources.')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={printPlan} aria-label={tr('Print gross-margin plan', 'طباعة خطة الهامش الإجمالي', 'Imprimer le plan de marge')}><Download className="me-1.5 h-3.5 w-3.5" />{tr('Print', 'طباعة', 'Imprimer')}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{tr('Planning estimate', 'تقدير تخطيطي', 'Estimation de planification')}</Badge>
          <span className="text-xs text-muted-foreground">{tr('All values are per hectare unless marked total.', 'كل القيم لكل هكتار ما لم تُذكر كإجمالي.', 'Toutes les valeurs sont par hectare sauf indication contraire.')}</span>
          <div className="ms-auto flex gap-1"><Button type="button" size="sm" variant="ghost" onClick={loadSavedBaseline} className="gap-1 text-xs"><RefreshCw className="h-3 w-3" />{tr('Use saved finance baseline', 'استخدم أساس البيانات المالية المحفوظة', 'Utiliser la base financière')}</Button><Button type="button" size="sm" variant="ghost" onClick={resetScenarios} className="text-xs">{tr('Reset', 'إعادة ضبط', 'Réinitialiser')}</Button></div>
        </div>
        {savedBaseline !== null && <p className="text-xs text-emerald-700 dark:text-emerald-300">{tr(`Loaded ${savedBaseline.toFixed(0)} $/ha from saved financial entries and split it between variable and fixed costs.`, `تم تحميل ${savedBaseline.toFixed(0)} دولار/هـ من السجلات المالية المحفوظة وتقسيمه بين التكاليف المتغيرة والثابتة.`, ` ${savedBaseline.toFixed(0)} $/ha chargés depuis les écritures financières et répartis entre coûts variables et fixes.`)}</p>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label={tr('Total area', 'المساحة الإجمالية', 'Surface totale')} value={`${portfolio.totalAreaHa.toFixed(1)} ha`} color="amber" />
          <Metric label={tr('Total gross margin', 'إجمالي الهامش الإجمالي', 'Marge brute totale')} value={`$${portfolio.totalGrossMargin.toFixed(0)}`} color={portfolio.totalGrossMargin >= 0 ? 'emerald' : 'red'} />
          <Metric label={tr('Weighted margin', 'الهامش الموزون', 'Marge pondérée')} value={`${portfolio.weightedMarginPct.toFixed(1)}%`} color={portfolio.weightedMarginPct >= 0 ? 'emerald' : 'red'} />
        </div>

        <div className="space-y-3">
          {scenarios.map((scenario, index) => {
            const result = portfolio.scenarios[index];
            const budgetVariance = result.budgetVariancePerHa ?? 0;
            return <div key={scenario.id} className={`rounded-xl border p-3 ${STATUS_STYLES[result.status]}`}>
              <div className="mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-600" /><span className="text-sm font-semibold">{tr('Scenario', 'السيناريو', 'Scénario')} {index + 1}</span><Badge variant="outline" className="ms-auto">{result.status === 'profitable' ? tr('Profitable', 'ربحي', 'Rentable') : result.status === 'breakEven' ? tr('Break-even', 'تعادل', 'Seuil') : tr('Loss', 'خسارة', 'Perte')}</Badge>{scenarios.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => removeScenario(scenario.id)} aria-label={tr('Remove scenario', 'حذف السيناريو', 'Supprimer le scénario')} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <FieldLabel label={tr('Crop', 'المحصول', 'Culture')}><select aria-label={tr('Crop', 'المحصول', 'Culture')} value={scenario.crop} onChange={e => updateScenario(scenario.id, { crop: e.target.value })} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">{CROPS.map(crop => <option key={crop.id} value={crop.id}>{cropLabel(crop.id)}</option>)}</select></FieldLabel>
                <FieldLabel label={tr('Area (ha)', 'المساحة (هـ)', 'Surface (ha)')}><Input aria-label={tr('Area in hectares', 'المساحة بالهكتار', 'Surface en hectares')} type="number" min="0" step="0.1" value={scenario.areaHa} onChange={e => updateScenario(scenario.id, { areaHa: numberValue(e.target.value) })} className="mt-1 h-9 text-sm" /></FieldLabel>
                <FieldLabel label={tr('Expected yield (t/ha)', 'الإنتاج المتوقع (ط/هـ)', 'Rendement prévu (t/ha)')}><Input aria-label={tr('Expected yield', 'الإنتاج المتوقع', 'Rendement prévu')} type="number" min="0" step="0.1" value={scenario.expectedYieldTPerHa} onChange={e => updateScenario(scenario.id, { expectedYieldTPerHa: numberValue(e.target.value) })} className="mt-1 h-9 text-sm" /></FieldLabel>
                <FieldLabel label={tr('Expected price ($/t)', 'السعر المتوقع ($/ط)', 'Prix prévu ($/t)')}><Input aria-label={tr('Expected price', 'السعر المتوقع', 'Prix prévu')} type="number" min="0" step="1" value={scenario.expectedPricePerT} onChange={e => updateScenario(scenario.id, { expectedPricePerT: numberValue(e.target.value) })} className="mt-1 h-9 text-sm" /></FieldLabel>
                <FieldLabel label={tr('Variable cost ($/ha)', 'التكلفة المتغيرة ($/هـ)', 'Coût variable ($/ha)')}><Input aria-label={tr('Variable cost per hectare', 'التكلفة المتغيرة لكل هكتار', 'Coût variable par hectare')} type="number" min="0" step="10" value={scenario.variableCostPerHa} onChange={e => updateScenario(scenario.id, { variableCostPerHa: numberValue(e.target.value) })} className="mt-1 h-9 text-sm" /></FieldLabel>
                <FieldLabel label={tr('Fixed cost ($/ha)', 'التكلفة الثابتة ($/هـ)', 'Coût fixe ($/ha)')}><Input aria-label={tr('Fixed cost per hectare', 'التكلفة الثابتة لكل هكتار', 'Coût fixe par hectare')} type="number" min="0" step="10" value={scenario.fixedCostPerHa} onChange={e => updateScenario(scenario.id, { fixedCostPerHa: numberValue(e.target.value) })} className="mt-1 h-9 text-sm" /></FieldLabel>
                <FieldLabel label={tr('Other revenue ($/ha)', 'إيرادات أخرى ($/هـ)', 'Autres revenus ($/ha)')}><Input aria-label={tr('Other revenue per hectare', 'إيرادات أخرى لكل هكتار', 'Autres revenus par hectare')} type="number" min="0" step="10" value={scenario.otherRevenuePerHa} onChange={e => updateScenario(scenario.id, { otherRevenuePerHa: numberValue(e.target.value) })} className="mt-1 h-9 text-sm" /></FieldLabel>
                <FieldLabel label={tr('Actual yield (optional)', 'الإنتاج الفعلي (اختياري)', 'Rendement réel (facultatif)')}><Input aria-label={tr('Actual yield', 'الإنتاج الفعلي', 'Rendement réel')} type="number" min="0" step="0.1" placeholder="—" value={scenario.actualYieldText} onChange={e => updateScenario(scenario.id, { actualYieldText: e.target.value })} className="mt-1 h-9 text-sm" /></FieldLabel>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Metric label={tr('Cost/ha', 'التكلفة/هـ', 'Coût/ha')} value={`$${result.totalCostPerHa.toFixed(0)}`} color="slate" />
                <Metric label={tr('Revenue/ha', 'الإيراد/هـ', 'Revenu/ha')} value={`$${result.revenuePerHa.toFixed(0)}`} color="cyan" />
                <Metric label={tr('Margin/ha', 'الهامش/هـ', 'Marge/ha')} value={`$${result.grossMarginPerHa.toFixed(0)}`} color={result.grossMarginPerHa >= 0 ? 'emerald' : 'red'} />
                <Metric label={tr('Break-even yield', 'إنتاج التعادل', 'Rendement seuil')} value={`${result.breakEvenYieldTPerHa.toFixed(2)} t/ha`} color="violet" />
                <Metric label={tr('Break-even price', 'سعر التعادل', 'Prix seuil')} value={`$${result.breakEvenPricePerT.toFixed(0)}/t`} color="violet" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{tr('Downside at −10% yield:', 'الهبوط عند −10% إنتاج:', 'Baisse à −10% rendement:')} <strong className="text-red-600">${result.sensitivity[0].grossMarginPerHa.toFixed(0)}/ha</strong></span><span>·</span><span>{tr('Downside at +10% cost:', 'الهبوط عند +10% تكلفة:', 'Baisse à +10% coût:')} <strong className="text-red-600">${result.sensitivity[2].grossMarginPerHa.toFixed(0)}/ha</strong></span>{result.actualGrossMarginPerHa !== null && <><span>·</span><span>{tr('Budget variance:', 'انحراف الميزانية:', 'Écart au budget:')} <strong className={budgetVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}>${budgetVariance.toFixed(0)}/ha</strong></span></>}</div>
            </div>;
          })}
        </div>

        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={addScenario} className="gap-1.5"><Plus className="h-3.5 w-3.5" />{tr('Add crop scenario', 'إضافة سيناريو محصول', 'Ajouter un scénario')}</Button><span className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />{tr('Compare before committing field area.', 'قارن قبل الالتزام بمساحة الحقل.', 'Comparez avant d’engager la surface.')}</span></div>

        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 text-xs leading-relaxed text-sky-900 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-100"><div className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" /><p><strong>{tr('How to use:', 'طريقة الاستخدام:', 'Mode d’emploi:')}</strong> {tr('Enter local costs, expected yield, and a realistic selling price. Add actual results after harvest to compare budget versus outcome. Break-even values exclude taxes, financing, and price volatility unless you include them in costs.', 'أدخل التكاليف المحلية والإنتاج المتوقع وسعر البيع الواقعي. أضف النتائج الفعلية بعد الحصاد لمقارنة الميزانية بالنتيجة. تستبعد قيم التعادل الضرائب والتمويل وتقلب الأسعار ما لم تضفها إلى التكاليف.', 'Saisissez les coûts locaux, le rendement prévu et un prix de vente réaliste. Ajoutez les résultats après récolte pour comparer le budget au résultat. Les seuils excluent taxes, financement et volatilité sauf si vous les incluez dans les coûts.')}</p></div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><p>{tr('Planning estimates are not a guarantee of profit, price, yield, or financing approval. Confirm contracts, input quotes, taxes, insurance, labor, and local market conditions before making financial commitments.', 'التقديرات التخطيطية لا تضمن الربح أو السعر أو الإنتاج أو الموافقة على التمويل. تحقق من العقود وعروض أسعار المدخلات والضرائب والتأمين والعمالة وظروف السوق المحلية قبل الالتزام المالي.', 'Les estimations ne garantissent ni bénéfice, ni prix, ni rendement, ni financement. Vérifiez contrats, devis, taxes, assurance, main-d’œuvre et conditions du marché avant tout engagement financier.')}</p></div></div>
      </CardContent>
    </Card>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-[10px] font-medium">{label}</Label>{children}</div>;
}

const METRIC_STYLES = {
  amber: 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20',
  emerald: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20',
  red: 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20',
  cyan: 'border-cyan-200 bg-cyan-50/60 dark:border-cyan-900 dark:bg-cyan-950/20',
  violet: 'border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/20',
  slate: 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/20',
};

function Metric({ label, value, color }: { label: string; value: string; color: keyof typeof METRIC_STYLES }) {
  return <div className={`rounded-lg border px-2.5 py-2 ${METRIC_STYLES[color]}`}><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="font-mono text-sm font-semibold leading-tight">{value}</div></div>;
}
