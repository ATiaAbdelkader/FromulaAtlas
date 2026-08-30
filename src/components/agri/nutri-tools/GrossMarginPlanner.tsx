'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  DollarSign,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  costPerHaFromEntries,
  calculateGrossMarginPortfolio,
  type GrossMarginScenarioInput,
} from '@/lib/gross-margin-planner';
import { getEntries } from '@/lib/financial-store';
import { toast } from '@/hooks/use-toast';

interface ScenarioDraft extends GrossMarginScenarioInput {
  actualYieldText: string;
  actualPriceText: string;
}

const CROPS = [
  { id: 'maize', en: 'Maize (Corn)', ar: 'ذرة صفراء', fr: 'Maïs grain', emoji: '🌽' },
  { id: 'wheat', en: 'Durum Wheat', ar: 'قمح صلب', fr: 'Blé dur', emoji: '🌾' },
  { id: 'tomato', en: 'Field Tomato', ar: 'طماطم حقلية', fr: 'Tomate plein champ', emoji: '🍅' },
  { id: 'potato', en: 'Potato', ar: 'بطاطا موسمية', fr: 'Pomme de terre', emoji: '🥔' },
  { id: 'cotton', en: 'Cotton', ar: 'قطن', fr: 'Coton', emoji: '🌱' },
];

const DEFAULT_SCENARIOS: ScenarioDraft[] = [
  {
    id: 'scenario-1',
    crop: 'maize',
    areaHa: 5,
    expectedYieldTPerHa: 8,
    expectedPricePerT: 220,
    variableCostPerHa: 760,
    fixedCostPerHa: 300,
    otherRevenuePerHa: 0,
    actualYieldText: '',
    actualPriceText: '',
  },
  {
    id: 'scenario-2',
    crop: 'wheat',
    areaHa: 4,
    expectedYieldTPerHa: 5.5,
    expectedPricePerT: 280,
    variableCostPerHa: 520,
    fixedCostPerHa: 280,
    otherRevenuePerHa: 0,
    actualYieldText: '',
    actualPriceText: '',
  },
];

const STATUS_STYLES = {
  profitable:
    'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30',
  breakEven:
    'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30',
  loss: 'border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-950/30',
};

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const TITLE: TrilingualString = {
  en: 'Gross-Margin & Break-Even Portfolio Planner',
  ar: 'مخطّط الهامش الإجمالي ونقطة التعادل ومحفظة المحاصيل',
  fr: 'Planificateur de Marge Brute & Seuil de Rentabilité',
};

const DESC: TrilingualString = {
  en: 'Compare multi-crop allocations by variable and fixed expenses, unit revenue, break-even thresholds, and downside sensitivity before committing field acreage.',
  ar: 'قارن خيارات توزيع المحاصيل حسب التكاليف المتغيرة والثابتة والإيراد ونقاط التعادل وحساسية المخاطر قبل الالتزام بمساحة الحقل.',
  fr: 'Analysez la rentabilité des cultures, les seuils de rentabilité et la sensibilité aux risques.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Break-even = Total Cost ÷ Price (for yield) or ÷ Yield (for price). Gross Margin = Revenue − Variable Cost. Downside sensitivity tests −10% yield and +10% input costs.',
  ar: 'معادلة التعادل = التكلفة الإجمالية ÷ السعر (للإنتاج) أو ÷ الإنتاج (للسعر). الهامش الإجمالي = الإيراد − التكلفة المتغيرة. اختبار الحساسية يفحص انخفاض الإنتاج −10% وزيادة التكاليف +10%.',
  fr: 'Seuil de rentabilité = Coût total ÷ Prix (rendement) ou ÷ Rendement (prix). Marge = Revenu − Coût variable. Sensibilité : −10% rdt et +10% coûts.',
};

export function GrossMarginPlanner() {
  const { language, isRTL } = useTranslation();
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>(DEFAULT_SCENARIOS);
  const [savedBaseline, setSavedBaseline] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const tr = (english: string, arabic: string, french?: string) =>
    copyFor(language, english, arabic, french);

  const portfolio = useMemo(
    () =>
      calculateGrossMarginPortfolio(
        scenarios.map(({ actualYieldText, actualPriceText, ...scenario }) => ({
          ...scenario,
          actualYieldTPerHa: actualYieldText === '' ? undefined : numberValue(actualYieldText),
          actualPricePerT: actualPriceText === '' ? undefined : numberValue(actualPriceText),
        }))
      ),
    [scenarios]
  );

  const cropLabel = (cropId: string) => {
    const crop = CROPS.find((item) => item.id === cropId);
    return crop
      ? `${crop.emoji} ${language === 'ar' ? crop.ar : language === 'fr' ? crop.fr : crop.en}`
      : cropId;
  };

  function updateScenario(id: string, patch: Partial<ScenarioDraft>) {
    setScenarios((current) =>
      current.map((scenario) => (scenario.id === id ? { ...scenario, ...patch } : scenario))
    );
  }

  function addScenario() {
    setScenarios((current) => [
      ...current,
      {
        ...DEFAULT_SCENARIOS[0],
        id: `scenario-${Date.now()}`,
        crop: 'tomato',
        areaHa: 2,
        expectedYieldTPerHa: 45,
        expectedPricePerT: 180,
        variableCostPerHa: 2200,
        fixedCostPerHa: 800,
        actualYieldText: '',
        actualPriceText: '',
      },
    ]);
  }

  function removeScenario(id: string) {
    if (scenarios.length <= 1) return;
    setScenarios((current) => current.filter((scenario) => scenario.id !== id));
  }

  function loadSavedBaseline() {
    const total = costPerHaFromEntries(getEntries());
    if (total <= 0) {
      toast({
        title: tr('No Financial Baseline Found', 'لا توجد سجلات مالية سابقة', 'Aucune donnée financière'),
        description: tr('Add farm expenses in the Accounting tab first.', 'أضف مصاريف الحقل في تبويب المحاسبة أولاً.', 'Ajoutez des écritures comptables d’abord.'),
      });
      return;
    }
    setSavedBaseline(total);
    setScenarios((current) =>
      current.map((scenario) => ({
        ...scenario,
        variableCostPerHa: Math.round(total * 0.65),
        fixedCostPerHa: Math.round(total * 0.35),
      }))
    );
    toast({
      title: tr('Baseline Applied', 'تم تطبيق خط الأساس المالي', 'Base financière appliquée'),
      description: `$${total.toFixed(0)} / ha`,
    });
  }

  function resetScenarios() {
    setScenarios(DEFAULT_SCENARIOS);
    setSavedBaseline(null);
    toast({
      title: tr('Reset Complete', 'تمت استعادة الإعدادات الافتراضية', 'Réinitialisation terminée'),
    });
  }

  function handleCopySummary() {
    const text = `
=== FARM GROSS-MARGIN & BREAK-EVEN ANALYSIS ===
Total Area: ${portfolio.totalAreaHa.toFixed(1)} ha | Total Gross Margin: $${portfolio.totalGrossMargin.toFixed(0)} | Weighted Margin: ${portfolio.weightedMarginPct.toFixed(1)}%

SCENARIOS:
${portfolio.scenarios
  .map(
    (s, i) =>
      `Scenario ${i + 1} (${cropLabel(s.crop)} - ${s.areaHa} ha):
• Revenue/ha: $${s.revenuePerHa.toFixed(0)} | Total Cost/ha: $${s.totalCostPerHa.toFixed(0)}
• Gross Margin/ha: $${s.grossMarginPerHa.toFixed(0)} (Status: ${s.status})
• Break-even Yield: ${s.breakEvenYieldTPerHa.toFixed(1)} t/ha | Break-even Price: $${s.breakEvenPricePerT.toFixed(0)}/t`
  )
  .join('\n\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Plan Copied!', 'تم نسخ خطة الهامش الإجمالي!', 'Plan copié !'),
    });
    setTimeout(() => setCopied(false), 3000);
  }

  function printPlan() {
    const title = tr(
      'Gross-Margin & Break-Even Plan',
      'خطة الهامش الإجمالي ونقطة التعادل',
      'Plan de marge brute et de seuil de rentabilité'
    );
    const rows = portfolio.scenarios
      .map(
        (scenario) =>
          `<tr><td>${cropLabel(scenario.crop)}</td><td>${scenario.areaHa.toFixed(1)}</td><td>${scenario.totalCostPerHa.toFixed(0)}</td><td>${scenario.revenuePerHa.toFixed(0)}</td><td>${scenario.grossMarginPerHa.toFixed(0)}</td><td>${scenario.breakEvenYieldTPerHa.toFixed(1)}</td><td>${scenario.breakEvenPricePerT.toFixed(0)}</td></tr>`
      )
      .join('');
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(
      `<!doctype html><html dir="${isRTL ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:1000px;margin:32px auto;padding:0 24px;color:#17202a;line-height:1.55}h1{color:#166534}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5e1;padding:7px;text-align:start}th{background:#ecfdf5;color:#166534}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.box{border:1px solid #bbf7d0;border-radius:8px;padding:10px;background:#f0fdf4}.label{font-size:11px;color:#64748b}.value{font-size:20px;font-weight:bold}</style></head><body><h1>${title}</h1><p>${tr('Scenario comparison for crop decisions.', 'مقارنة سيناريوهات لاتخاذ قرارات المحاصيل.', 'Comparaison de scénarios pour les décisions culturales.')}</p><div class="summary"><div class="box"><div class="label">${tr('Total area', 'المساحة الإجمالية', 'Surface totale')}</div><div class="value">${portfolio.totalAreaHa.toFixed(1)} ha</div></div><div class="box"><div class="label">${tr('Total gross margin', 'إجمالي الهامش الإجمالي', 'Marge brute totale')}</div><div class="value">$${portfolio.totalGrossMargin.toFixed(0)}</div></div><div class="box"><div class="label">${tr('Weighted margin', 'الهامش الموزون', 'Marge pondérée')}</div><div class="value">${portfolio.weightedMarginPct.toFixed(1)}%</div></div></div><table><thead><tr><th>${tr('Crop', 'المحصول', 'Culture')}</th><th>${tr('Area ha', 'المساحة هـ', 'Surface ha')}</th><th>${tr('Cost/ha', 'التكلفة/هـ', 'Coût/ha')}</th><th>${tr('Revenue/ha', 'الإيراد/هـ', 'Revenu/ha')}</th><th>${tr('Margin/ha', 'الهامش/هـ', 'Marge/ha')}</th><th>${tr('Break-even yield', 'إنتاج التعادل', 'Rendement seuil')}</th><th>${tr('Break-even price', 'سعر التعادل', 'Prix seuil')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
    );
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <CalculatorShell
      icon={DollarSign}
      title={TITLE}
      description={DESC}
      badge="Financial Ag"
      accent="emerald"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopySummary,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: Download,
          label: { en: 'Print PDF', ar: 'طباعة PDF', fr: 'Imprimer' },
          onClick: printPlan,
        },
        {
          icon: RefreshCw,
          label: { en: 'Load Baseline', ar: 'استيراد الأساس', fr: 'Base compta' },
          onClick: loadSavedBaseline,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: resetScenarios,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <div className="lg:col-span-12 space-y-6">
      {savedBaseline !== null && (
        <div className="p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            {tr(
              `Loaded $${savedBaseline.toFixed(0)} /ha baseline from financial ledger entries.`,
              `تم استيراد خط الأساس المالي بقيمة $${savedBaseline.toFixed(0)} /هكتار من سجل المصاريف.`,
              `Base financière de $${savedBaseline.toFixed(0)} /ha importée avec succès.`
            )}
          </span>
        </div>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {tr('Total Farm Acreage', 'المساحة الإجمالية المزروعة', 'Surface totale cultivée')}
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
            {portfolio.totalAreaHa.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">ha</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {tr('Total Portfolio Gross Margin', 'إجمالي الهامش الإجمالي للمحفظة', 'Marge brute totale')}
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              portfolio.totalGrossMargin >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            ${portfolio.totalGrossMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {tr('Weighted Margin Return', 'نسبة الهامش الإجمالي الموزون', 'Taux de marge pondéré')}
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              portfolio.weightedMarginPct >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {portfolio.weightedMarginPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-4">
        {scenarios.map((scenario, index) => {
          const result = portfolio.scenarios[index];
          const budgetVariance = result.budgetVariancePerHa ?? 0;

          return (
            <Card
              key={scenario.id}
              className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
                STATUS_STYLES[result.status]
              }`}
            >
              <CardHeader className="p-4 pb-3 bg-muted/20 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold">
                    {tr('Crop Scenario', 'سيناريو المحصول', 'Scénario')} {index + 1}: {cropLabel(scenario.crop)}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold font-mono">
                    {scenario.areaHa} ha
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold ${
                      result.status === 'profitable'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : result.status === 'breakEven'
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {result.status === 'profitable'
                      ? tr('Profitable', 'ربحي', 'Rentable')
                      : result.status === 'breakEven'
                      ? tr('Break-Even', 'تعادل', 'Seuil')
                      : tr('Loss Risk', 'خسارة', 'Perte')}
                  </Badge>

                  {scenarios.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeScenario(scenario.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Crop', 'المحصول', 'Culture')}
                    </Label>
                    <select
                      value={scenario.crop}
                      onChange={(e) => updateScenario(scenario.id, { crop: e.target.value })}
                      className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                    >
                      {CROPS.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {cropLabel(crop.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Area (ha)', 'المساحة (هـ)', 'Surface (ha)')}
                    </Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={scenario.areaHa}
                      onChange={(e) =>
                        updateScenario(scenario.id, { areaHa: numberValue(e.target.value) })
                      }
                      className="mt-1 h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Expected Yield (t/ha)', 'الإنتاج المتوقع (ط/هـ)', 'Rendement prévu (t/ha)')}
                    </Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={scenario.expectedYieldTPerHa}
                      onChange={(e) =>
                        updateScenario(scenario.id, {
                          expectedYieldTPerHa: numberValue(e.target.value),
                        })
                      }
                      className="mt-1 h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Expected Price ($/t)', 'السعر المتوقع ($/ط)', 'Prix prévu ($/t)')}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={scenario.expectedPricePerT}
                      onChange={(e) =>
                        updateScenario(scenario.id, {
                          expectedPricePerT: numberValue(e.target.value),
                        })
                      }
                      className="mt-1 h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Variable Cost ($/ha)', 'التكلفة المتغيرة ($/هـ)', 'Coût variable ($/ha)')}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      value={scenario.variableCostPerHa}
                      onChange={(e) =>
                        updateScenario(scenario.id, {
                          variableCostPerHa: numberValue(e.target.value),
                        })
                      }
                      className="mt-1 h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Fixed Cost ($/ha)', 'التكلفة الثابتة ($/هـ)', 'Coût fixe ($/ha)')}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      value={scenario.fixedCostPerHa}
                      onChange={(e) =>
                        updateScenario(scenario.id, {
                          fixedCostPerHa: numberValue(e.target.value),
                        })
                      }
                      className="mt-1 h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Other Revenue ($/ha)', 'إيرادات أخرى ($/هـ)', 'Autres revenus ($/ha)')}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      value={scenario.otherRevenuePerHa}
                      onChange={(e) =>
                        updateScenario(scenario.id, {
                          otherRevenuePerHa: numberValue(e.target.value),
                        })
                      }
                      className="mt-1 h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {tr('Actual Harvest Yield (t/ha)', 'الإنتاج الفعلي بعد الحصاد', 'Rendement réel')}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="—"
                      value={scenario.actualYieldText}
                      onChange={(e) =>
                        updateScenario(scenario.id, { actualYieldText: e.target.value })
                      }
                      className="mt-1 h-8 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Scenario Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t text-xs">
                  <div className="p-2.5 rounded-xl border bg-background/80 space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">{tr('Total Cost/ha', 'التكلفة/هـ', 'Coût/ha')}</div>
                    <div className="font-mono font-black text-sm text-foreground">${result.totalCostPerHa.toFixed(0)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-background/80 space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">{tr('Revenue/ha', 'الإيراد/هـ', 'Revenu/ha')}</div>
                    <div className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">${result.revenuePerHa.toFixed(0)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-background/80 space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">{tr('Gross Margin/ha', 'الهامش/هـ', 'Marge/ha')}</div>
                    <div className={`font-mono font-black text-sm ${result.grossMarginPerHa >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      ${result.grossMarginPerHa.toFixed(0)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-background/80 space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">{tr('Break-Even Yield', 'إنتاج التعادل', 'Rendement seuil')}</div>
                    <div className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">{result.breakEvenYieldTPerHa.toFixed(1)} t/ha</div>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-background/80 space-y-0.5">
                    <div className="text-[10px] text-muted-foreground uppercase">{tr('Break-Even Price', 'سعر التعادل', 'Prix seuil')}</div>
                    <div className="font-mono font-black text-sm text-purple-600 dark:text-purple-400">${result.breakEvenPricePerT.toFixed(0)} /t</div>
                  </div>
                </div>

                {/* Sensitivity & Risk Analysis Footer */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1 bg-background/50 p-2.5 rounded-xl border">
                  <span>
                    {tr('Downside at −10% Yield:', 'الهبوط عند انخفاض الإنتاج −10%:', 'Baisse à −10% rdt:')}{' '}
                    <strong className="text-rose-600 font-mono font-bold">${result.sensitivity[0].grossMarginPerHa.toFixed(0)}/ha</strong>
                  </span>
                  <span>·</span>
                  <span>
                    {tr('Downside at +10% Input Costs:', 'الهبوط عند زيادة التكاليف +10%:', 'Baisse à +10% coûts:')}{' '}
                    <strong className="text-rose-600 font-mono font-bold">${result.sensitivity[2].grossMarginPerHa.toFixed(0)}/ha</strong>
                  </span>
                  {result.actualGrossMarginPerHa !== null && (
                    <>
                      <span>·</span>
                      <span>
                        {tr('Budget Variance:', 'انحراف الميزانية:', 'Écart budget:')}{' '}
                        <strong className={`font-mono font-bold ${budgetVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ${budgetVariance.toFixed(0)}/ha
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Scenario Action */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={addScenario}
          className="gap-1.5 text-xs font-semibold bg-background"
        >
          <Plus className="h-4 w-4 text-emerald-600" />
          {tr('Add Crop Scenario', 'إضافة سيناريو محصول آخر', 'Ajouter un scénario')}
        </Button>
      </div>
      </div>
    </CalculatorShell>
  );
}
