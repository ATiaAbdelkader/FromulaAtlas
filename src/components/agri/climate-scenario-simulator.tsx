'use client';

/**
 * Farm Climate Scenario Simulator — En-ROADS pattern adapted for farms.
 *
 * Farmers drag sliders for 8 climate-smart practices and instantly see:
 *   - CO₂ emissions: baseline vs scenario (bar chart)
 *   - Carbon sequestration potential
 *   - Water savings
 *   - Soil organic matter improvement (10-year projection)
 *   - Net DZD cost/savings
 *   - 10-year trajectory chart (baseline vs scenario)
 *
 * Also includes scenario sharing via URL + a reset button.
 *
 * Trilingual (EN/FR/AR).
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Cloud, Droplets, TrendingDown, TrendingUp, RefreshCw, Share2,
  Leaf, Wallet, Activity, Globe, ChevronRight,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import {
  CLIMATE_LEVERS, DEFAULT_SCENARIO, simulateScenario, generateScenarioURL,
  type ScenarioState, type ScenarioResult,
} from '@/lib/climate-scenario-simulator';
import { cn } from '@/lib/utils';

export function ClimateScenarioSimulator() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [scenario, setScenario] = useState<ScenarioState>(DEFAULT_SCENARIO);
  const [areaHa, setAreaHa] = useState('5');
  const [baselineN, setBaselineN] = useState('120');
  const [baselineDiesel, setBaselineDiesel] = useState('2000');
  const [shared, setShared] = useState(false);

  const result: ScenarioResult = useMemo(() => {
    return simulateScenario(
      scenario,
      parseFloat(areaHa) || 5,
      parseFloat(baselineN) || 120,
      parseFloat(baselineDiesel) || 2000,
    );
  }, [scenario, areaHa, baselineN, baselineDiesel]);

  const updateLever = useCallback((id: string, value: number) => {
    setScenario(prev => ({ ...prev, [id]: value }));
  }, []);

  const reset = useCallback(() => {
    setScenario(DEFAULT_SCENARIO);
  }, []);

  const share = useCallback(() => {
    const url = generateScenarioURL(scenario);
    navigator.clipboard?.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [scenario]);

  const fmtDZD = (v: number) => v >= 0 ? `+${Math.round(v).toLocaleString()} DZD` : `${Math.round(v).toLocaleString()} DZD`;
  const fmtCO2 = (v: number) => `${v.toFixed(1)} tCO₂e`;
  const fmtWater = (v: number) => `${Math.round(v).toLocaleString()} m³`;

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Globe className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-bold">
              {tr('Farm Climate Scenario Simulator', 'محاكي سيناريو المناخ للمزرعة', 'Simulateur de Scénario Climatique de Ferme')}
            </h2>
            <p className="text-xs text-white/75 mt-0.5">
              {tr('Drag sliders to see how your practices affect emissions, carbon, water, and money.', 'اسحب المؤشرات لترى تأثير ممارساتك على الانبعاثات والكربون والماء والمال.', 'Glissez les curseurs pour voir l\'impact de vos pratiques sur les émissions, le carbone, l\'eau et l\'argent.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="secondary" size="sm" onClick={reset} className="h-8 text-[10px] gap-1">
            <RefreshCw className="h-3 w-3" />{tr('Reset', 'إعادة', 'Réinit.')}
          </Button>
          <Button variant="secondary" size="sm" onClick={share} className="h-8 text-[10px] gap-1">
            <Share2 className="h-3 w-3" />
            {shared ? tr('Copied!', 'تم!', 'Copié!') : tr('Share', 'مشاركة', 'Partager')}
          </Button>
        </div>
      </div>

      {/* Farm parameters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-cyan-600" />
            {tr('Your farm parameters', 'معايير مزرعتك', 'Paramètres de votre ferme')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">{tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}</Label>
              <Input value={areaHa} onChange={(e) => setAreaHa(e.target.value)} type="number" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">{tr('N (kg/ha)', 'أزوت (كغ/هـ)', 'N (kg/ha)')}</Label>
              <Input value={baselineN} onChange={(e) => setBaselineN(e.target.value)} type="number" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">{tr('Diesel (L/yr)', 'ديزل (ل/سنة)', 'Diesel (L/an)')}</Label>
              <Input value={baselineDiesel} onChange={(e) => setBaselineDiesel(e.target.value)} type="number" className="h-8 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Levers (sliders) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-cyan-600" />
            {tr('Climate-smart practices (levers)', 'الممارسات الذكية مناخياً (مؤشرات)', 'Pratiques climato-intelligentes (leviers)')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CLIMATE_LEVERS.map(lever => (
            <div key={lever.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{lever.emoji}</span>
                  <span className="text-xs font-medium">
                    {language === 'ar' ? lever.label.ar : language === 'fr' ? lever.label.fr : lever.label.en}
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono" style={{ color: lever.color, borderColor: lever.color }}>
                  {scenario[lever.id as keyof ScenarioState]}{lever.unit}
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground mb-1.5">
                {language === 'ar' ? lever.description.ar : language === 'fr' ? lever.description.fr : lever.description.en}
              </p>
              <Slider
                value={[scenario[lever.id as keyof ScenarioState]]}
                min={lever.min}
                max={lever.max}
                step={lever.step}
                onValueChange={(v) => updateLever(lever.id, v[0])}
                className="cursor-pointer"
                style={{ ['--primary' as string]: lever.color }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Results — key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricCard
          icon={TrendingDown}
          label={tr('Emissions cut', 'خفض الانبعاثات', 'Réduction émissions')}
          value={fmtCO2(result.emissionReduction)}
          sub={`${result.emissionReductionPct.toFixed(0)}%`}
          color="#16a34a"
        />
        <MetricCard
          icon={Leaf}
          label={tr('Carbon seq.', 'عزل الكربون', 'Séquestration')}
          value={fmtCO2(result.sequestrationPotential)}
          sub={result.netCarbonBalance < 0 ? tr('Carbon sink!', 'مصدر كربون!', 'Puits de carbone!') : tr('Still emitting', 'ما زال ينبعث', 'Émet encore')}
          color={result.netCarbonBalance < 0 ? '#16a34a' : '#f59e0b'}
        />
        <MetricCard
          icon={Droplets}
          label={tr('Water saved', 'ماء موفّر', 'Eau économisée')}
          value={fmtWater(result.waterSavings)}
          sub={tr('per year', 'سنوياً', 'par an')}
          color="#0284c7"
        />
        <MetricCard
          icon={Wallet}
          label={tr('Net DZD/yr', 'دينار/سنة', 'DZD/an')}
          value={fmtDZD(result.netDZD)}
          sub={result.netDZD >= 0 ? tr('Saving', 'وفّرت', 'Économie') : tr('Cost', 'تكلفة', 'Coût')}
          color={result.netDZD >= 0 ? '#16a34a' : '#dc2626'}
        />
      </div>

      {/* Emissions comparison bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">{tr('CO₂ Emissions: Baseline vs Your Scenario', 'انبعاثات CO₂: المرجعي مقابل سيناريوك', 'Émissions CO₂: Référence vs Scénario')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>{tr('Baseline', 'المرجعي', 'Référence')}</span>
                <span>{fmtCO2(result.baselineEmissions)}{tr('/yr', '/سنة', '/an')}</span>
              </div>
              <div className="h-6 rounded bg-red-200 dark:bg-red-950/40 overflow-hidden">
                <div className="h-full bg-red-500 rounded transition-all" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>{tr('Your scenario', 'سيناريوك', 'Votre scénario')}</span>
                <span>{fmtCO2(result.scenarioEmissions)}{tr('/yr', '/سنة', '/an')}</span>
              </div>
              <div className="h-6 rounded bg-emerald-200 dark:bg-emerald-950/40 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded transition-all"
                  style={{ width: `${Math.max(2, (result.scenarioEmissions / result.baselineEmissions) * 100)}%` }}
                />
              </div>
            </div>
            {/* Sequestration */}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>{tr('Carbon sequestration', 'عزل الكربون', 'Séquestration carbone')}</span>
                <span>−{fmtCO2(result.sequestrationPotential)}{tr('/yr', '/سنة', '/an')}</span>
              </div>
              <div className="h-6 rounded bg-cyan-200 dark:bg-cyan-950/40 overflow-hidden flex flex-row-reverse">
                <div className="h-full bg-cyan-500 rounded transition-all" style={{ width: `${Math.min(100, (result.sequestrationPotential / result.baselineEmissions) * 100)}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 10-year trajectory chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">{tr('10-Year Cumulative Emissions', 'الانبعاثات التراكمية لـ10 سنوات', 'Émissions cumulées sur 10 ans')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrajectoryChart trajectory={result.trajectory} />
        </CardContent>
      </Card>

      {/* Economic breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
            {tr('Economic breakdown (DZD/yr)', 'التفصيل الاقتصادي (دينار/سنة)', 'Décomposition économique (DZD/an)')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <EconRow label={tr('Nitrogen savings', 'وفّر النيتروجين', 'Économie d\'azote')} value={result.nitrogenSavingsDZD} />
          <EconRow label={tr('Diesel savings (solar pump)', 'وفّر الديزل (مضخة شمسية)', 'Économie diesel (solaire)')} value={result.dieselSavingsDZD} />
          <EconRow label={tr('Water savings', 'وفّر الماء', 'Économie d\'eau')} value={result.waterSavingsDZD} />
          <EconRow label={tr('Solar pump maintenance savings', 'وفّر صيانة المضخة', 'Économie maintenance solaire')} value={result.solarSavingsDZD} />
          <EconRow label={tr('Carbon credit revenue', 'إيراد أرصدة الكربون', 'Revenu crédits carbone')} value={result.carbonCreditRevenue} />
          <EconRow label={tr('Compost cost', 'تكلفة السماد العضوي', 'Coût compost')} value={-result.compostCostDZD} />
          <EconRow label={tr('Tree planting cost', 'تكلفة زراعة الأشجار', 'Coût plantation arbres')} value={-result.treeCostDZD} />
          <div className="border-t border-border/40 pt-1.5 mt-1.5">
            <EconRow label={tr('NET (per year)', 'الصافي (سنوياً)', 'NET (par an)')} value={result.netDZD} bold />
          </div>
        </CardContent>
      </Card>

      {/* Soil health */}
      <Card className={cn('border', result.soilOMImprovement > 0 ? 'border-emerald-300 dark:border-emerald-900' : 'border-border')}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 shrink-0">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold">
              {tr('Soil organic matter improvement', 'تحسين المادة العضوية للتربة', 'Amélioration de la matière organique du sol')}
            </div>
            <div className="text-sm font-bold text-emerald-600 mt-0.5">
              +{result.soilOMImprovement.toFixed(2)}% {tr('over 10 years', 'عبر 10 سنوات', 'sur 10 ans')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Cloud; label: string; value: string; sub: string; color: string;
}) {
  return (
    <Card className="p-2.5 text-center">
      <div className="flex h-7 w-7 mx-auto items-center justify-center rounded-md" style={{ background: `${color}20`, color }}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-xs font-bold mt-1" style={{ color }}>{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
      <div className="text-[9px] font-semibold" style={{ color }}>{sub}</div>
    </Card>
  );
}

function EconRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  const isPositive = value >= 0;
  return (
    <div className={cn('flex justify-between items-center text-[11px]', bold && 'font-bold text-sm')}>
      <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
      <span className="font-mono" style={{ color: bold ? (isPositive ? '#16a34a' : '#dc2626') : isPositive ? '#16a34a' : '#dc2626' }}>
        {isPositive ? '+' : ''}{Math.round(value).toLocaleString()} DZD
      </span>
    </div>
  );
}

function TrajectoryChart({ trajectory }: {
  trajectory: { year: number; baseline: number; scenario: number }[];
}) {
  const maxVal = Math.max(...trajectory.map(t => Math.max(t.baseline, t.scenario)), 1);

  // SVG dimensions
  const W = 600, H = 160, P = 30;
  const chartW = W - P * 2, chartH = H - P * 2;
  const stepX = chartW / (trajectory.length - 1);

  const baselinePath = trajectory.map((t, i) => {
    const x = P + i * stepX;
    const y = P + chartH - (t.baseline / maxVal) * chartH;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const scenarioPath = trajectory.map((t, i) => {
    const x = P + i * stepX;
    const y = P + chartH - (t.scenario / maxVal) * chartH;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={p} x1={P} y1={P + chartH * (1 - p)} x2={W - P} y2={P + chartH * (1 - p)}
            stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
        ))}
        {/* Baseline line */}
        <path d={baselinePath} fill="none" stroke="#dc2626" strokeWidth={2} />
        {/* Scenario line */}
        <path d={scenarioPath} fill="none" stroke="#16a34a" strokeWidth={2} />
        {/* X-axis labels */}
        {trajectory.filter(t => t.year % 2 === 0).map(t => {
          const x = P + t.year * stepX;
          return <text key={t.year} x={x} y={H - 5} fontSize={9} textAnchor="middle" fill="currentColor" opacity={0.5}>{t.year}y</text>;
        })}
        {/* Y-axis label */}
        <text x={5} y={P + chartH / 2} fontSize={8} textAnchor="middle" fill="currentColor" opacity={0.5}
          transform={`rotate(-90 5 ${P + chartH / 2})`}>tCO₂e</text>
      </svg>
      <div className="flex items-center justify-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded bg-red-500" />
          <span className="text-[9px] text-muted-foreground">Baseline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded bg-emerald-500" />
          <span className="text-[9px] text-muted-foreground">Your scenario</span>
        </div>
      </div>
    </div>
  );
}
