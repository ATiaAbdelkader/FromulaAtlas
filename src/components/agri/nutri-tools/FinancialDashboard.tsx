'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Download,
  AlertTriangle, CheckCircle2, PiggyBank, Target, Percent, Layers,
  Copy, RotateCcw,
} from 'lucide-react';
import {
  getEntries, addEntry, removeEntry, computeSummary, scenarioImpact, SEED_ENTRIES,
  CATEGORY_META, type FinancialEntry,
} from '@/lib/financial-store';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell, type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const CATEGORY_LABELS: Record<FinancialEntry['category'], string> = {
  seed: 'بذور', fertilizer: 'أسمدة', crop_protection: 'وقاية المحصول', irrigation: 'ري',
  fuel: 'وقود وطاقة', labor: 'عمالة', rent: 'إيجار الأرض', machinery: 'آلات',
  other_cost: 'تكاليف أخرى', crop_revenue: 'مبيعات المحصول', subsidy: 'إعانات', other_revenue: 'إيرادات أخرى',
};

function categoryLabel(category: FinancialEntry['category'], language: Parameters<typeof copyFor>[0]): string {
  return copyFor(language, CATEGORY_META[category].label, CATEGORY_LABELS[category]);
}

const TITLE: TrilingualString = {
  en: 'Financial Dashboard',
  ar: 'اللوحة المالية',
  fr: 'Tableau de Bord Financier',
};

const DESC: TrilingualString = {
  en: 'Track costs, revenue, gross margin, ROI, break-even and run what-if scenarios for your farm enterprise — all per hectare.',
  ar: 'تابع التكاليف والإيرادات والهامش الإجمالي والعائد ونقطة التعادل، وأجرِ تحليلات سيناريو «ماذا لو» لمزرعتك — كل ذلك لكل هكتار.',
  fr: 'Suivez coûts, revenus, marge brute, ROI et point mort, et simulez des scénarios « what-if » pour votre exploitation — par hectare.',
};

export function FinancialDashboard() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [yieldT, setYieldT] = useState('10');
  const [pricePerT, setPricePerT] = useState('200');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ category: 'fertilizer' as FinancialEntry['category'], label: '', amount: '' });
  const [scenario, setScenario] = useState({ costDeltaPct: 0, priceDeltaPct: 0, yieldDeltaPct: 0 });
  const [copied, setCopied] = useState(false);
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  useEffect(() => {
    let e = getEntries();
    if (e.length === 0) { e = SEED_ENTRIES; setEntries(e); }
    else setEntries(e);
  }, []);

  const summary = useMemo(() => computeSummary(entries, parseFloat(yieldT) || 0, parseFloat(pricePerT) || 0), [entries, yieldT, pricePerT]);
  const scenarioResult = useMemo(() => scenarioImpact(entries, parseFloat(yieldT) || 0, parseFloat(pricePerT) || 0, scenario), [entries, yieldT, pricePerT, scenario]);

  const handleAdd = () => {
    if (!newEntry.label.trim() || !newEntry.amount) return;
    const entry: FinancialEntry = { id: `e-${Date.now()}`, category: newEntry.category, label: newEntry.label, amount: parseFloat(newEntry.amount) };
    setEntries(addEntry(entry));
    setNewEntry({ category: 'fertilizer', label: '', amount: '' });
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => setEntries(removeEntry(id));

  const loadSeedData = () => { setEntries(SEED_ENTRIES); };
  const clearAll = () => { setEntries([]); };

  const handleReset = () => {
    setYieldT('10');
    setPricePerT('200');
    setScenario({ costDeltaPct: 0, priceDeltaPct: 0, yieldDeltaPct: 0 });
    setEntries(SEED_ENTRIES);
    toast({ title: tr('Reset done', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    const text = `=== FARM FINANCIALS ===\nYield: ${yieldT} t/ha\nPrice: $${pricePerT}/t\n\nTotal costs: $${summary.totalCosts.toFixed(0)}/ha\nTotal revenue: $${summary.totalRevenue.toFixed(0)}/ha\nGross margin: $${summary.grossMargin.toFixed(0)}/ha (${summary.grossMarginPct.toFixed(0)}%)\nROI: ${summary.roi.toFixed(0)}%\nBreak-even yield: ${summary.breakEvenYield.toFixed(2)} t/ha\nBreak-even price: $${summary.breakEvenPrice.toFixed(0)}/t\nCost per tonne: $${summary.costPerTonne.toFixed(0)}/t`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const costs = entries.filter(e => CATEGORY_META[e.category].type === 'cost');
  const revenues = entries.filter(e => CATEGORY_META[e.category].type === 'revenue');

  const exportPdf = () => {
    const win = window.open('', '_blank');
    const trPdf = (english: string, arabic: string) => copyFor(language, english, arabic);
    if (!win) return;
    const costRows = costs.map((e, i) => `<tr><td>${i+1}</td><td>${CATEGORY_META[e.category].emoji} ${categoryLabel(e.category, language)}</td><td>${e.label}</td><td style="text-align:right">$${e.amount.toFixed(2)}</td></tr>`).join('');
    const revRows = revenues.map((e, i) => `<tr><td>${i+1}</td><td>${CATEGORY_META[e.category].emoji} ${categoryLabel(e.category, language)}</td><td>${e.label}</td><td style="text-align:right">$${e.amount.toFixed(2)}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>${trPdf('Farm Financial Report', 'التقرير المالي للمزرعة')}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#16a34a;font-size:20px}
      .meta{color:#475569;font-size:12px;margin-bottom:16px}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
      .stat{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px} .stat-label{font-size:10px;color:#16a34a;text-transform:uppercase} .stat-value{font-size:18px;font-weight:bold}
      .neg{color:#dc2626} .pos{color:#16a34a}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px} th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left} td{padding:4px 6px;border:1px solid #d1fae5}
      @page{size:landscape;margin:12mm}
    </style></head><body dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <h1>💰 ${trPdf('Farm Financial Report', 'التقرير المالي للمزرعة')}</h1>
      <div class="meta">${trPdf('Yield', 'الإنتاج')}: ${yieldT} t/ha · ${trPdf('Price', 'السعر')}: $${pricePerT}/t · ${trPdf('Generated', 'أُنشئ')}: ${new Date().toLocaleString(language === 'ar' ? 'ar' : undefined)}</div>
      <div class="summary">
        <div class="stat"><div class="stat-label">${trPdf('Total Costs', 'إجمالي التكاليف')}</div><div class="stat-value neg">$${summary.totalCosts.toFixed(0)}</div></div>
        <div class="stat"><div class="stat-label">${trPdf('Total Revenue', 'إجمالي الإيرادات')}</div><div class="stat-value pos">$${summary.totalRevenue.toFixed(0)}</div></div>
        <div class="stat"><div class="stat-label">${trPdf('Gross Margin', 'الهامش الإجمالي')}</div><div class="stat-value ${summary.grossMargin >= 0 ? 'pos' : 'neg'}">$${summary.grossMargin.toFixed(0)}</div></div>
        <div class="stat"><div class="stat-label">${trPdf('ROI', 'العائد على الاستثمار')}</div><div class="stat-value ${summary.roi >= 0 ? 'pos' : 'neg'}">${summary.roi.toFixed(1)}%</div></div>
      </div>
      <h2>${trPdf('Costs', 'التكاليف')} ($${summary.totalCosts.toFixed(2)}/ha)</h2><table><thead><tr><th>#</th><th>${trPdf('Category', 'الفئة')}</th><th>${trPdf('Description', 'الوصف')}</th><th>${trPdf('Amount ($/ha)', 'المبلغ ($/هـ)')}</th></tr></thead><tbody>${costRows}</tbody></table>
      <h2>${trPdf('Revenue', 'الإيرادات')} ($${summary.totalRevenue.toFixed(2)}/ha)</h2><table><thead><tr><th>#</th><th>${trPdf('Category', 'الفئة')}</th><th>${trPdf('Description', 'الوصف')}</th><th>${trPdf('Amount ($/ha)', 'المبلغ ($/هـ)')}</th></tr></thead><tbody>${revRows}</tbody></table>
      <div class="summary">
        <div class="stat"><div class="stat-label">${trPdf('Break-even yield', 'إنتاج التعادل')}</div><div class="stat-value">${summary.breakEvenYield.toFixed(2)} t/ha</div></div>
        <div class="stat"><div class="stat-label">${trPdf('Break-even price', 'سعر التعادل')}</div><div class="stat-value">$${summary.breakEvenPrice.toFixed(0)}/t</div></div>
        <div class="stat"><div class="stat-label">${trPdf('Cost per tonne', 'تكلفة الطن')}</div><div class="stat-value">$${summary.costPerTonne.toFixed(0)}/t</div></div>
        <div class="stat"><div class="stat-label">${trPdf('Margin %', 'الهامش %')}</div><div class="stat-value">${summary.grossMarginPct.toFixed(1)}%</div></div>
      </div>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  return (
    <CalculatorShell
      icon={DollarSign}
      title={TITLE}
      description={DESC}
      badge="Per Hectare"
      accent="emerald"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخّص', fr: 'Copier' },
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
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              {tr('Yield & Price Inputs', 'مدخلات الإنتاج والسعر', 'Rendement & Prix')}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={exportPdf} className="gap-1 text-xs h-8"><Download className="h-3 w-3" /> {tr('PDF', 'PDF', 'PDF')}</Button>
              <Button size="sm" variant="ghost" onClick={loadSeedData} className="text-[10px] h-8" title={tr('Load sample data', 'تحميل بيانات نموذجية', 'Charger exemple')}>{tr('Sample', 'نموذج', 'Exemple')}</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Yield (t/ha)', 'الإنتاج (ط/هـ)', 'Rendement (t/ha)')}
              value={yieldT}
              onChange={setYieldT}
              placeholder="10"
              helper={tr('Harvested yield per hectare', 'الإنتاج المحصود لكل هكتار', 'Rendement récolté / ha')}
            />
            <CalculatorShell.InputField
              label={tr('Price ($/t)', 'السعر ($/ط)', 'Prix ($/t)')}
              value={pricePerT}
              onChange={setPricePerT}
              placeholder="200"
              helper={tr('Sale price per tonne', 'سعر البيع للطن', 'Prix de vente / tonne')}
            />
          </div>

          {/* Add entry form */}
          {showAddForm ? (
            <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <select value={newEntry.category} onChange={e => setNewEntry({ ...newEntry, category: e.target.value as FinancialEntry['category'] })} className="h-8 text-xs rounded-md border border-input bg-background px-2">
                  {(Object.keys(CATEGORY_META) as FinancialEntry['category'][]).map(c => <option key={c} value={c}>{CATEGORY_META[c].emoji} {categoryLabel(c, language)}</option>)}
                </select>
                <Input value={newEntry.label} onChange={e => setNewEntry({ ...newEntry, label: e.target.value })} placeholder={tr('Description', 'الوصف', 'Description')} className="h-8 text-xs" />
                <Input value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} type="number" placeholder={tr('$ amount/ha', '$ المبلغ/هـ', '$ montant/ha')} className="h-8 text-xs" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>{tr('Cancel', 'إلغاء', 'Annuler')}</Button>
                <Button size="sm" onClick={handleAdd} disabled={!newEntry.label.trim() || !newEntry.amount} className="gap-1"><Plus className="h-3 w-3" /> {tr('Add', 'أضف', 'Ajouter')}</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="gap-1.5 w-full"><Plus className="h-3.5 w-3.5" /> {tr('Add Cost or Revenue Item', 'أضف تكلفة أو إيراد', 'Ajouter coût/revenu')}</Button>
          )}

          {/* Scenario analysis */}
          <div className="rounded-lg p-3 border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20">
            <div className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {tr('What-If Scenario', 'تحليل سيناريو ماذا لو', 'Scénario « What-If »')}</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { key: 'costDeltaPct', label: tr('Costs change %', 'تغيير التكاليف %', 'Δ Coûts %'), icon: '📉' },
                { key: 'priceDeltaPct', label: tr('Price change %', 'تغيير السعر %', 'Δ Prix %'), icon: '💲' },
                { key: 'yieldDeltaPct', label: tr('Yield change %', 'تغيير الإنتاج %', 'Δ Rdt %'), icon: '🌾' },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-[10px]">{f.icon} {f.label}</Label>
                  <Input value={String(scenario[f.key as keyof typeof scenario])} onChange={e => setScenario({ ...scenario, [f.key]: parseFloat(e.target.value) || 0 })} type="number" step="5" className="h-8 text-xs mt-0.5" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="ghost" onClick={() => setScenario({ costDeltaPct: 20, priceDeltaPct: 0, yieldDeltaPct: 0 })} className="text-[10px] h-7">{tr('Costs +20%', 'تكاليف +20%', 'Coûts +20%')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setScenario({ costDeltaPct: 0, priceDeltaPct: -15, yieldDeltaPct: 0 })} className="text-[10px] h-7">{tr('Price -15%', 'سعر -15%', 'Prix -15%')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setScenario({ costDeltaPct: 0, priceDeltaPct: 0, yieldDeltaPct: 10 })} className="text-[10px] h-7">{tr('Yield +10%', 'إنتاج +10%', 'Rdt +10%')}</Button>
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Financial Summary', 'الملخّص المالي', 'Synthèse Financière')}
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">
              {summary.grossMargin >= 0 ? '+' : ''}${summary.grossMargin.toFixed(0)}/ha
            </span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard label={tr('Total Costs', 'إجمالي التكاليف', 'Coûts totaux')} value={`$${summary.totalCosts.toFixed(0)}`} sub="/ha" icon={TrendingDown} color="#dc2626" />
            <StatCard label={tr('Total Revenue', 'إجمالي الإيرادات', 'Revenu total')} value={`$${summary.totalRevenue.toFixed(0)}`} sub="/ha" icon={TrendingUp} color="#16a34a" />
            <StatCard label={tr('Gross Margin', 'الهامش الإجمالي', 'Marge brute')} value={`$${summary.grossMargin.toFixed(0)}`} sub={`${summary.grossMarginPct.toFixed(0)}%`} icon={PiggyBank} color={summary.grossMargin >= 0 ? '#16a34a' : '#dc2626'} />
            <StatCard label={tr('ROI', 'العائد', 'ROI')} value={`${summary.roi.toFixed(0)}%`} sub={tr('return on costs', 'عائد على التكاليف', 'retour sur coûts')} icon={Percent} color={summary.roi >= 0 ? '#16a34a' : '#dc2626'} />
          </div>

          {/* Break-even cards */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label={tr('Break-even yield', 'إنتاج التعادل', 'Point mort rdt')} value={`${summary.breakEvenYield.toFixed(2)} t/ha`} icon={Target} good={parseFloat(yieldT) > summary.breakEvenYield} />
            <MiniStat label={tr('Break-even price', 'سعر التعادل', 'Point mort prix')} value={`$${summary.breakEvenPrice.toFixed(0)}/t`} icon={Target} good={parseFloat(pricePerT) > summary.breakEvenPrice} />
            <MiniStat label={tr('Cost per tonne', 'تكلفة الطن', 'Coût / tonne')} value={`$${summary.costPerTonne.toFixed(0)}/t`} icon={Layers} good={summary.costPerTonne < parseFloat(pricePerT)} />
          </div>

          {/* Scenario result */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="rounded p-2 bg-background/60 border border-border">
              <div className="text-[9px] text-muted-foreground">{tr('Scenario margin', 'هامش السيناريو', 'Marge scénario')}</div>
              <div className="font-bold" style={{ color: scenarioResult.grossMargin >= 0 ? '#16a34a' : '#dc2626' }}>${scenarioResult.grossMargin.toFixed(0)}</div>
              <div className="text-[9px]" style={{ color: scenarioResult.grossMargin > summary.grossMargin ? '#16a34a' : '#dc2626' }}>
                {scenarioResult.grossMargin > summary.grossMargin ? '▲' : '▼'} ${Math.abs(scenarioResult.grossMargin - summary.grossMargin).toFixed(0)} {tr('vs current', 'مقابل الحالي', 'vs actuel')}
              </div>
            </div>
            <div className="rounded p-2 bg-background/60 border border-border">
              <div className="text-[9px] text-muted-foreground">{tr('Scenario ROI', 'عائد السيناريو', 'ROI scénario')}</div>
              <div className="font-bold" style={{ color: scenarioResult.roi >= 0 ? '#16a34a' : '#dc2626' }}>{scenarioResult.roi.toFixed(0)}%</div>
            </div>
            <div className="rounded p-2 bg-background/60 border border-border">
              <div className="text-[9px] text-muted-foreground">{tr('Cost/tonne', 'تكلفة/طن', 'Coût/tonne')}</div>
              <div className="font-bold">${scenarioResult.costPerTonne.toFixed(0)}</div>
            </div>
            <div className="rounded p-2 bg-background/60 border border-border">
              <div className="text-[9px] text-muted-foreground">{tr('Break-even', 'التعادل', 'Point mort')}</div>
              <div className="font-bold">{scenarioResult.breakEvenYield.toFixed(2)}</div>
            </div>
          </div>

          {/* Profitability indicator */}
          <div className={`rounded-lg p-3 border ${summary.grossMargin >= 0 ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900'}`}>
            <div className="flex items-center gap-2">
              {summary.grossMargin >= 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
              <span className="text-sm font-bold">{summary.grossMargin >= 0 ? tr('Profitable', 'ربحي', 'Rentable') : tr('Operating at a loss', 'يعمل بخسارة', 'À perte')}</span>
              <span className="text-xs text-muted-foreground ms-auto">
                {summary.grossMargin >= 0
                  ? tr(`Every $1 invested returns $${(1 + summary.roi / 100).toFixed(2)}`, `كل $1 مُستثمر يُعيد $${(1 + summary.roi / 100).toFixed(2)}`, `Chaque $1 investi rapporte $${(1 + summary.roi / 100).toFixed(2)}`)
                  : tr(`Losing $${Math.abs(summary.grossMargin).toFixed(0)}/ha — reduce costs or increase yield`, `خسارة $${Math.abs(summary.grossMargin).toFixed(0)}/هـ — قلّل التكاليف أو زيادة الإنتاج`, `Perte $${Math.abs(summary.grossMargin).toFixed(0)}/ha — réduisez les coûts ou augmentez le rendement`)}
              </span>
            </div>
          </div>

          {/* Cost breakdown chart */}
          <div className="max-h-72 overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1 sticky top-0 bg-card pb-1">
              <DollarSign className="h-3.5 w-3.5" /> {tr('Cost Breakdown', 'تفصيل التكاليف', 'Détail des coûts')}
            </div>
            <div className="space-y-1">
              {costs.sort((a, b) => b.amount - a.amount).map(e => {
                const pct = summary.totalCosts > 0 ? (e.amount / summary.totalCosts) * 100 : 0;
                return (
                  <div key={e.id} className="group flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_META[e.category].emoji}</span>
                    <span className="text-xs flex-1 truncate">{e.label}</span>
                    <div className="w-24 h-3 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORY_META[e.category].color }} />
                    </div>
                    <span className="text-xs font-mono w-12 text-right">${e.amount.toFixed(0)}</span>
                    <span className="text-[9px] text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                    <button onClick={() => handleRemove(e.id)} aria-label={tr('Remove entry', 'حذف السجل', 'Supprimer')} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                  </div>
                );
              })}
              {costs.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {tr('No costs. Click "Add Cost or Revenue Item".', 'لا تكاليف. اضغط «أضف تكلفة أو إيراد».', 'Aucun coût. Cliquez sur « Ajouter coût/revenu ».')}
                </div>
              )}
            </div>
          </div>

          {entries.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearAll} className="w-full text-xs text-muted-foreground">
              {tr('Clear all entries', 'مسح كل السجلات', 'Tout effacer')}
            </Button>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: typeof DollarSign; color: string }) {
  return (
    <div className="rounded-lg p-2.5 border bg-muted/20">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground font-semibold"><Icon className="h-2.5 w-2.5" style={{ color }} />{label}</div>
      <div className="text-lg font-bold mt-0.5" style={{ color }}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, good }: { label: string; value: string; icon: typeof Target; good: boolean }) {
  return (
    <div className={`rounded-lg p-2 border ${good ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/10'}`}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground font-semibold"><Icon className="h-2.5 w-2.5" />{label}</div>
      <div className="text-sm font-bold mt-0.5" style={{ color: good ? '#16a34a' : '#ea580c' }}>{value}</div>
    </div>
  );
}
