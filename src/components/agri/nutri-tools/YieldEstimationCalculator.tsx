'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Calculator,
  Sprout,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  DollarSign,
  ShieldCheck,
  Info,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

interface CropYieldProfile {
  name: string;
  name_ar: string;
  name_fr: string;
  emoji: string;
  kernelWeight: number; // in grams
  defaultHeads: number; // heads/m²
  defaultKernels: number; // kernels/head
  typicalPricePerT: number; // in USD
}

const CROPS: Record<string, CropYieldProfile> = {
  wheat: {
    name: 'Durum / Bread Wheat',
    name_ar: 'قمح صلب / لين',
    name_fr: 'Blé dur / tendre',
    emoji: '🌾',
    kernelWeight: 0.04,
    defaultHeads: 500,
    defaultKernels: 35,
    typicalPricePerT: 290,
  },
  barley: {
    name: 'Barley',
    name_ar: 'شعير علفي / بذور',
    name_fr: 'Orge',
    emoji: '🌾',
    kernelWeight: 0.045,
    defaultHeads: 450,
    defaultKernels: 30,
    typicalPricePerT: 230,
  },
  corn: {
    name: 'Corn (Maize)',
    name_ar: 'ذرة صفراء (مايز)',
    name_fr: 'Maïs grain',
    emoji: '🌽',
    kernelWeight: 0.30,
    defaultHeads: 8,
    defaultKernels: 500,
    typicalPricePerT: 220,
  },
  rice: {
    name: 'Paddy Rice',
    name_ar: 'أرز خام',
    name_fr: 'Riz paddy',
    emoji: '🍚',
    kernelWeight: 0.025,
    defaultHeads: 400,
    defaultKernels: 80,
    typicalPricePerT: 340,
  },
  sorghum: {
    name: 'Sorghum',
    name_ar: 'سورغم (ذرة بيضاء)',
    name_fr: 'Sorgho',
    emoji: '🌾',
    kernelWeight: 0.03,
    defaultHeads: 300,
    defaultKernels: 1200,
    typicalPricePerT: 210,
  },
  oats: {
    name: 'Oats',
    name_ar: 'شوفان',
    name_fr: 'Avoine',
    emoji: '🌾',
    kernelWeight: 0.035,
    defaultHeads: 400,
    defaultKernels: 40,
    typicalPricePerT: 250,
  },
};

export function YieldEstimationCalculator() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [crop, setCrop] = useState<string>('wheat');
  const [headsPerM2, setHeadsPerM2] = useState<string>('');
  const [kernelsPerHead, setKernelsPerHead] = useState<string>('');
  const [kernelWeight, setKernelWeight] = useState<string>('');
  const [area, setArea] = useState<string>('5');
  const [pricePerT, setPricePerT] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const cropInfo = CROPS[crop] || CROPS.wheat;

  const result = useMemo(() => {
    const h = parseFloat(headsPerM2) || cropInfo.defaultHeads;
    const k = parseFloat(kernelsPerHead) || cropInfo.defaultKernels;
    const w = parseFloat(kernelWeight) || cropInfo.kernelWeight;
    const a = Math.max(0.1, parseFloat(area) || 1);
    const p = parseFloat(pricePerT) || cropInfo.typicalPricePerT;

    // Yield (kg/ha) = heads/m² × kernels/head × kernel weight (g) × 10
    const yieldKgPerHa = h * k * w * 10;
    const yieldTPerHa = yieldKgPerHa / 1000;
    const totalYield = yieldTPerHa * a;
    const totalRevenue = totalYield * p;

    // Components
    const kernelsPerM2 = h * k;
    const biomassPerM2 = kernelsPerM2 * w; // g/m²

    return {
      h,
      k,
      w,
      a,
      p,
      yieldKgPerHa,
      yieldTPerHa,
      totalYield,
      totalRevenue,
      kernelsPerM2,
      biomassPerM2,
    };
  }, [crop, headsPerM2, kernelsPerHead, kernelWeight, area, pricePerT, cropInfo]);

  const handleReset = () => {
    setHeadsPerM2('');
    setKernelsPerHead('');
    setKernelWeight('');
    setArea('5');
    setPricePerT('');
    toast({
      title: tr('Reset to Crop Defaults', 'تمت استعادة القيم الافتراضية للمحصول', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    const text = `
=== PRE-HARVEST QUADRAT YIELD ESTIMATION ===
Crop: ${cropInfo.emoji} ${cropInfo.name} | Field Area: ${result.a} ha
Sampling Parameters:
• Plant Density / Spikes: ${result.h} heads/m²
• Grain Filling: ${result.k} kernels/head
• Thousand Grain Weight (TGW): ${(result.w * 1000).toFixed(1)} g (${result.w} g/kernel)

Estimated Productivity:
• Yield Potential: ${result.yieldTPerHa.toFixed(2)} tonnes/ha (${result.yieldKgPerHa.toFixed(0)} kg/ha)
• Total Field Output: ${result.totalYield.toFixed(1)} tonnes (${result.a} ha)
• Estimated Gross Revenue: $${result.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} (@ $${result.p}/t)
• Kernel Density: ${result.kernelsPerM2.toLocaleString()} kernels/m²
• Grain Biomass: ${result.biomassPerM2.toFixed(1)} g/m²
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ ملخص تقدير الإنتاجية!', 'Résumé copié !'),
      description: tr('Yield analysis report copied to clipboard.', 'تم نسخ تقرير التقدير المحصولي إلى الحافظة.', 'Rapport copié.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-cyan-950 text-white p-6 shadow-xl border border-emerald-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <TrendingUp className="h-6 w-6 text-emerald-300" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {tr(
                    'Pre-Harvest Quadrat Yield & Biomass Estimator',
                    'حاسبة التقدير المحصولي الميداني والكتلة الحيوية (Quadrat Method)',
                    'Estimateur de Rendement Pré-Récolte & Biomasse'
                  )}
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 text-[10px] uppercase tracking-wider">
                    Agronomy Standard
                  </Badge>
                </h2>
              </div>
            </div>
            <p className="text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
              {tr(
                'Predict harvest volume and field revenue by sampling heads/m², grain count per ear, and thousand-kernel weight (TKW) across 6 major field crops.',
                'تقدير كميات الحصاد والعائد المالي بدقة عبر فحص كثافة السنابل وعدد الحبوب ووزن ألف حبة عبر أخذ عينات المربع (1م²).',
                'Estimez le rendement parcellaire et le chiffre d’affaires prévisionnel à partir des composantes du rendement.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleCopySummary}
              variant="outline"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-white/25 backdrop-blur font-semibold shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-emerald-300" />
                  {tr('Copied!', 'تم النسخ!', 'Copié !')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1 text-emerald-300" />
                  {tr('Copy Summary', 'نسخ التقرير', 'Copier')}
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
            >
              <RotateCcw className="h-4 w-4 mr-1 text-stone-300" />
              {tr('Reset Defaults', 'إعادة تعيين', 'Réinitialiser')}
            </Button>
          </div>
        </div>

        {/* Quick Crop Selector Pill Bar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-200/80 font-medium mr-1">
            {tr('Select Crop:', 'اختر المحصول:', 'Culture :')}
          </span>
          {Object.entries(CROPS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => {
                setCrop(k);
                setHeadsPerM2('');
                setKernelsPerHead('');
                setKernelWeight('');
                setPricePerT('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                crop === k
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-emerald-100'
              }`}
            >
              <span>{v.emoji}</span>
              <span>{isAr ? v.name_ar : isFr ? v.name_fr : v.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Inputs and Result Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Sampling Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  {tr('Field Sampling Parameters (Quadrat Method)', 'مدخلات العينات الميدانية (طريقة المربع 1م²)', 'Paramètres d’Échantillonnage au Champ')}
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 font-bold">
                  {cropInfo.emoji} {isAr ? cropInfo.name_ar : isFr ? cropInfo.name_fr : cropInfo.name}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <Label className="text-xs font-bold text-foreground">
                    {tr('Spikes / Heads per m²', 'عدد السنابل / الكيزان لكل م²', 'Épis / Capitules par m²')}
                  </Label>
                  <Input
                    type="number"
                    step="10"
                    placeholder={String(cropInfo.defaultHeads)}
                    value={headsPerM2}
                    onChange={(e) => setHeadsPerM2(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    {tr(`Default: ${cropInfo.defaultHeads} heads/m²`, `الافتراضي: ${cropInfo.defaultHeads} سنبلة/م²`, `Défaut : ${cropInfo.defaultHeads}`)}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <Label className="text-xs font-bold text-foreground">
                    {tr('Kernels / Grains per Head', 'عدد الحبوب في السنبلة الواحدة', 'Grains par épi')}
                  </Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder={String(cropInfo.defaultKernels)}
                    value={kernelsPerHead}
                    onChange={(e) => setKernelsPerHead(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    {tr(`Default: ${cropInfo.defaultKernels} grains`, `الافتراضي: ${cropInfo.defaultKernels} حبة`, `Défaut : ${cropInfo.defaultKernels}`)}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <Label className="text-xs font-bold text-foreground">
                    {tr('Average Kernel Weight (g)', 'متوسط وزن الحبة (غرام)', 'Poids moyen du grain (g)')}
                  </Label>
                  <Input
                    type="number"
                    step="0.005"
                    placeholder={String(cropInfo.kernelWeight)}
                    value={kernelWeight}
                    onChange={(e) => setKernelWeight(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    {tr(`TKW: ${(cropInfo.kernelWeight * 1000).toFixed(0)}g / 1000 grains`, `وزن 1000 حبة: ${(cropInfo.kernelWeight * 1000).toFixed(0)} غرام`, `PMG : ${(cropInfo.kernelWeight * 1000).toFixed(0)}g`)}
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <Label className="text-xs font-bold text-foreground">
                    {tr('Field Area (Hectares)', 'مساحة الحقل الإجمالية (هكتار)', 'Surface de la parcelle (ha)')}
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    {tr('Total harvest acreage', 'المساحة المزروعة للحصاد', 'Superficie cultivée')}
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 rounded-xl border bg-card space-y-1">
                  <Label className="text-xs font-bold text-foreground">
                    {tr('Expected Commodity Price ($/tonne)', 'سعر البيع المتوقع ($/طن)', 'Prix de vente prévu ($/tonne)')}
                  </Label>
                  <Input
                    type="number"
                    step="10"
                    placeholder={String(cropInfo.typicalPricePerT)}
                    value={pricePerT}
                    onChange={(e) => setPricePerT(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    {tr(`Benchmark: $${cropInfo.typicalPricePerT}/t`, `السعر المرجعي: $${cropInfo.typicalPricePerT}/طن`, `Référence : $${cropInfo.typicalPricePerT}/t`)}
                  </div>
                </div>
              </div>

              {/* Protocol Note */}
              <div className="p-3.5 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{tr('Quadrat Sampling Guideline:', 'إرشادات أخذ العينات الميدانية:', 'Méthode d’échantillonnage :')}</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {tr(
                    'Throw a 1×1m square frame in 5 representative spots of your field. Count heads in each, take 10 random ears to count grains, and weigh 100 grains (÷100 for single kernel weight).',
                    'قم برمي إطار بمساحة 1×1م في 5 مواقع تمثيلية من الحقل. احسب السنابل في كل مربع، ثم خذ 10 سنابل عشوائية لعد الحبوب، وازن 100 حبة بدقة للحصول على متوسط وزن الحبة.',
                    'Placez un cadre de 1×1m dans 5 zones représentatives. Comptez les épis, égrenez 10 épis pour la fertilité et pesez 100 grains pour obtenir le poids unitaire.'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Yield Output Cards & Financial Valuation */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-border shadow-xs rounded-2xl overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-emerald-50 via-background to-teal-50/50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  {tr('Estimated Yield & Production Output', 'تقديرات الإنتاجية والمحصول الكلي', 'Estimation du Rendement & Production')}
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                  {result.yieldTPerHa.toFixed(2)} t/ha
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
              {/* Primary Metric Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    {tr('Unit Yield Potential', 'إنتاجية الهكتار', 'Rendement à l’hectare')}
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {result.yieldTPerHa.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">t/ha</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ≈ {result.yieldKgPerHa.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/ha
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 space-y-1">
                  <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                    {tr(`Total Harvest (${result.a} ha)`, `إجمالي المحصول (${result.a} هـ)`, `Production totale (${result.a} ha)`)}
                  </div>
                  <div className="text-2xl font-black text-teal-700 dark:text-teal-300 font-mono">
                    {result.totalYield.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">tonnes</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {result.a} hectares total area
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-card space-y-1">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {tr('Kernel Density', 'كثافة الحبوب', 'Densité de grains')}
                  </div>
                  <div className="text-xl font-black text-foreground font-mono">
                    {result.kernelsPerM2.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">grains/m²</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {result.h} heads × {result.k} kernels
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-card space-y-1">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {tr('Estimated Revenue', 'العائد المالي التقديري', 'Revenu prévisionnel')}
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ${result.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    @ ${result.p} / tonne
                  </div>
                </div>
              </div>

              {/* Formula & Traceability Box */}
              <div className="p-3.5 rounded-xl bg-card border space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <span>{tr('Calculation Mathematical Expression:', 'المعادلة الرياضية الحسابية:', 'Formule de calcul :')}</span>
                </div>
                <div className="font-mono text-[11px] p-2.5 rounded-lg bg-muted/50 border text-foreground leading-relaxed">
                  Yield (kg/ha) = {result.h} heads/m² × {result.k} kernels/head × {result.w} g × 10
                  <br />
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                    = {result.yieldKgPerHa.toFixed(0)} kg/ha ({result.yieldTPerHa.toFixed(2)} t/ha)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
