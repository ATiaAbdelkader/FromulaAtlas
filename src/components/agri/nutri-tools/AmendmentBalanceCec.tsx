'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Sparkles,
  Layers,
  FlaskConical,
  Sprout,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Info,
  ArrowRight,
  Calculator,
  X,
} from 'lucide-react';
import {
  BASE_AMENDMENTS,
  CATION_LABELS,
  EQUIV_WEIGHTS,
  IDEAL_CATION_RANGES,
  phIndicator,
} from '@/lib/nutri-tools-data';
import { CropPresetDropdown } from './CropPresetDropdown';
import type { CropPreset } from '@/lib/crop-presets';
import { useBridgePayload } from '@/lib/use-bridge-payload';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

/**
 * Tool 7 — Amendment Balance by CEC (Albrecht & Kinsey BCSR Model)
 */
export function AmendmentBalanceCec() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [initial, setInitial] = useState<Record<string, string>>({
    k: '0.35',
    ca: '8.5',
    mg: '1.8',
    h: '0.5',
    na: '0.2',
    al: '0',
  });
  const [target, setTarget] = useState<Record<string, string>>({});
  const [density, setDensity] = useState('1.15');
  const [depth, setDepth] = useState('30');
  const [ph, setPh] = useState('6.8');
  const [reach, setReach] = useState('100');
  const [fieldAreaHa, setFieldAreaHa] = useState('10');
  const [preset, setPreset] = useState<CropPreset | null>(null);
  const [copiedPrescription, setCopiedPrescription] = useState<boolean>(false);

  // "Send to" bridge — receive cation values + pH from Field Data Capture.
  const bridgePayload = useBridgePayload('amendment-balance');
  const [bridgeBanner, setBridgeBanner] = useState<{ count: number } | null>(null);

  useEffect(() => {
    if (!bridgePayload) return;
    const v = bridgePayload.values;
    const num = (k: string): number =>
      typeof v[k] === 'number' ? (v[k] as number) : parseFloat(String(v[k] ?? '0')) || 0;
    const cationKeys = ['k', 'ca', 'mg', 'h', 'na', 'al'] as const;
    const next: Record<string, string> = { ...initial };
    let count = 0;
    for (const c of cationKeys) {
      const val = num(c);
      if (Number.isFinite(val) && val >= 0) {
        next[c] = String(val);
        if (val > 0) count++;
      }
    }
    setInitial(next);
    const phVal = num('ph');
    if (phVal > 0) {
      setPh(String(phVal));
      count++;
    }
    setBridgeBanner({ count });
  }, [bridgePayload]);

  const applyCropPreset = (p: CropPreset) => {
    setPreset(p);
    toast({
      title: tr('Crop Preset Applied', 'تم تطبيق معايير المحصول المرجعية', 'Préréglage appliqué'),
      description: `${p.emoji} ${p.name}`,
    });
  };

  const cations = ['ca', 'mg', 'k', 'na', 'h', 'al'] as const;

  const parsed = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of cations) out[c] = parseFloat(initial[c] || '0') || 0;
    return out;
  }, [initial]);

  const cic = parsed.k + parsed.ca + parsed.mg + parsed.h + parsed.na + parsed.al;

  // Auto-compute ideal targets (Ca=75%, K=5%, Mg=15% of CEC, others=0)
  const autoTargets = useMemo(() => {
    return {
      ca: Math.round(cic * 0.75 * 100) / 100,
      mg: Math.round(cic * 0.15 * 100) / 100,
      k: Math.round(cic * 0.05 * 100) / 100,
      h: 0,
      na: 0,
      al: 0,
    } as Record<string, number>;
  }, [cic]);

  // Apply auto targets if user hasn't entered
  const effectiveTargets = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of cations) {
      const t = parseFloat(target[c] || '');
      out[c] = Number.isFinite(t) ? t : autoTargets[c] - parsed[c];
    }
    return out;
  }, [target, autoTargets, parsed]);

  const densityN = parseFloat(density) || 1.15;
  const depthN = parseFloat(depth) || 30;
  const phN = parseFloat(ph) || 6.8;
  const reachN = Math.min(100, Math.max(10, parseFloat(reach) || 100));
  const areaN = parseFloat(fieldAreaHa) || 10;
  const factor = reachN / 100;

  const phInd = phIndicator(phN);

  const meqToKgHa = (meq: number, eqWeight: number) =>
    (meq * eqWeight * 10 * (100 * 100 * (depthN / 100) * densityN)) / 1000;

  // Strategy: dolomite first (if ca+mg both needed), then gypsum/lime for ca, mgso4 for mg, sop for k
  const selected = BASE_AMENDMENTS;
  const strategy = useMemo(() => {
    const out: {
      amendment: (typeof BASE_AMENDMENTS)[0];
      dosis: number;
      ca: number;
      mg: number;
      k: number;
      so4: number;
      si: number;
      formulaCode: string;
    }[] = [];
    let caRest = Math.max(0, effectiveTargets.ca);
    let mgRest = Math.max(0, effectiveTargets.mg);
    const kRest = Math.max(0, effectiveTargets.k);
    const naExcess = parsed.na > cic * 0.05 ? parsed.na - cic * 0.03 : 0;

    const dolomite = selected.find((a) => a.id === 'dolomite');
    const gypsum = selected.find((a) => a.id === 'gypsum');
    const lime = selected.find((a) => a.id === 'lime');
    const mgso4 = selected.find((a) => a.id === 'mgso4-mono');
    const sop = selected.find((a) => a.id === 'sop-granular');

    if (dolomite && caRest > 0 && mgRest > 0 && phN < 6.5) {
      const caKg = meqToKgHa(caRest, EQUIV_WEIGHTS.ca);
      const mgKg = meqToKgHa(mgRest, EQUIV_WEIGHTS.mg);
      const caAmt = caKg / (dolomite.ca / 100);
      const mgAmt = mgKg / (dolomite.mg / 100);
      const dosis = Math.max(caAmt, mgAmt);
      out.push({
        amendment: dolomite,
        dosis,
        ca: (dosis * dolomite.ca) / 100,
        mg: (dosis * dolomite.mg) / 100,
        k: 0,
        so4: 0,
        si: 0,
        formulaCode: 'Formula SH.4',
      });
      caRest = Math.max(0, caRest - ((dosis * dolomite.ca) / 100) / meqToKgHa(1, EQUIV_WEIGHTS.ca));
      mgRest = Math.max(0, mgRest - ((dosis * dolomite.mg) / 100) / meqToKgHa(1, EQUIV_WEIGHTS.mg));
    }

    if (caRest > 0) {
      if (phN > 7.3 && gypsum) {
        const caKg = meqToKgHa(caRest, EQUIV_WEIGHTS.ca);
        const dosis = caKg / (gypsum.ca / 100);
        out.push({
          amendment: gypsum,
          dosis,
          ca: (dosis * gypsum.ca) / 100,
          mg: 0,
          k: 0,
          so4: (dosis * gypsum.so4) / 100,
          si: 0,
          formulaCode: 'Formula 49.2',
        });
      } else if (lime) {
        const caKg = meqToKgHa(caRest, EQUIV_WEIGHTS.ca);
        const dosis = caKg / (lime.ca / 100);
        out.push({
          amendment: lime,
          dosis,
          ca: (dosis * lime.ca) / 100,
          mg: 0,
          k: 0,
          so4: 0,
          si: 0,
          formulaCode: 'Formula SH.4',
        });
      }
    }

    if (mgRest > 0 && mgso4) {
      const mgKg = meqToKgHa(mgRest, EQUIV_WEIGHTS.mg);
      const dosis = mgKg / (mgso4.mg / 100);
      out.push({
        amendment: mgso4,
        dosis,
        ca: 0,
        mg: (dosis * mgso4.mg) / 100,
        k: 0,
        so4: (dosis * mgso4.so4) / 100,
        si: 0,
        formulaCode: 'Formula 4.1',
      });
    }

    if (kRest > 0 && sop) {
      const kKg = meqToKgHa(kRest, EQUIV_WEIGHTS.k);
      const dosis = kKg / (sop.k / 100);
      out.push({
        amendment: sop,
        dosis,
        ca: 0,
        mg: 0,
        k: (dosis * sop.k) / 100,
        so4: (dosis * sop.so4) / 100,
        si: 0,
        formulaCode: 'Formula 4.1',
      });
    }

    if (naExcess > 0 && gypsum && !out.some((x) => x.amendment.id === 'gypsum')) {
      const naKg = meqToKgHa(naExcess, EQUIV_WEIGHTS.na);
      const dosis = (naKg * 1.5) / (gypsum.ca / 100);
      out.push({
        amendment: gypsum,
        dosis,
        ca: (dosis * gypsum.ca) / 100,
        mg: 0,
        k: 0,
        so4: (dosis * gypsum.so4) / 100,
        si: 0,
        formulaCode: 'Formula 49.2',
      });
    }

    return out.filter((s) => s.dosis >= 50);
  }, [effectiveTargets, selected, densityN, depthN, phN, parsed, cic]);

  const reset = () => {
    setInitial({ k: '0.35', ca: '8.5', mg: '1.8', h: '0.5', na: '0.2', al: '0' });
    setTarget({});
    setDensity('1.15');
    setDepth('30');
    setPh('6.8');
    setReach('100');
    setPreset(null);
    toast({
      title: tr('Reset Complete', 'تمت استعادة القيم الافتراضية', 'Réinitialisation terminée'),
    });
  };

  const handleCopySummary = () => {
    const text = `
=== SOIL CEC & CATION AMENDMENT PRESCRIPTION ===
Total CEC: ${cic.toFixed(2)} meq/100g | Soil pH: ${phN} (${phInd.label})
Soil Depth: ${depthN} cm | Bulk Density: ${densityN} g/cm³ | Area: ${areaN} ha

1. BASE SATURATION STATUS:
• Calcium (Ca): ${parsed.ca} meq (${cic > 0 ? ((parsed.ca / cic) * 100).toFixed(1) : 0}%) [Ideal: 65-75%]
• Magnesium (Mg): ${parsed.mg} meq (${cic > 0 ? ((parsed.mg / cic) * 100).toFixed(1) : 0}%) [Ideal: 10-15%]
• Potassium (K): ${parsed.k} meq (${cic > 0 ? ((parsed.k / cic) * 100).toFixed(1) : 0}%) [Ideal: 3-5%]
• Sodium (Na): ${parsed.na} meq (${cic > 0 ? ((parsed.na / cic) * 100).toFixed(1) : 0}%) [Ideal: < 3%]

2. RECOMMENDED AMENDMENTS (KG/HA):
${strategy.map((s) => `• ${s.amendment.name} [${s.formulaCode}]: ${(s.dosis * factor).toFixed(0)} kg/ha (Total: ${((s.dosis * factor * areaN) / 1000).toFixed(2)} tonnes for ${areaN} ha)`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedPrescription(true);
    toast({
      title: tr('Prescription Copied!', 'تم نسخ الوصفة التعديلية!', 'Ordonnance copiée !'),
      description: tr('Full CEC cation amendment report copied to clipboard.', 'تم نسخ تقرير التعديل الكاتيوني إلى الحافظة.', 'Rapport d’amendement copié.'),
    });
    setTimeout(() => setCopiedPrescription(false), 3000);
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-stone-900 to-emerald-950 text-white p-6 shadow-xl border border-amber-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Scale className="h-6 w-6 text-amber-300" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {tr(
                    'Soil CEC Cation Balance & Base Saturation Solver',
                    'حاسبة توازن الكاتيونات والمحسنات حسب السعة التبادلية (CEC)',
                    'Équilibre Cationique & Amendements par CEC'
                  )}
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-200 border-amber-400/40 text-[10px] uppercase tracking-wider">
                    Albrecht Model
                  </Badge>
                </h2>
              </div>
            </div>
            <p className="text-sm text-amber-100/90 max-w-3xl leading-relaxed">
              {tr(
                'Calculates exact agricultural lime, gypsum, magnesium sulfate, and SOP amendment requirements to achieve ideal base saturation ratios (Ca 65-75%, Mg 10-15%, K 3-5%, Na < 3%).',
                'حساب دقيق لجرعات الجير الزراعي والجبس وسلفات المغنيسيوم وسلفات البوتاسيوم لتحقيق التوازن المثالي لمعقد الامتصاص.',
                'Calculez précisément les doses de chaux, gypse, sulfate de magnésie et sulfate de potasse pour atteindre la saturation idéale en bases.'
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
              {copiedPrescription ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-emerald-300" />
                  {tr('Copied!', 'تم النسخ!', 'Copié !')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1 text-amber-300" />
                  {tr('Copy Summary', 'نسخ التقرير', 'Copier')}
                </>
              )}
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
            >
              <RotateCcw className="h-4 w-4 mr-1 text-stone-300" />
              {tr('Reset', 'إعادة ضبط', 'Réinitialiser')}
            </Button>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-200/80 font-medium">
              {tr('Target Crop Reference:', 'المحصول المرجعي المستهدف:', 'Culture de référence :')}
            </span>
            <CropPresetDropdown onSelect={applyCropPreset} value={preset?.id ?? null} />
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-200/80">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{tr('Equilibrium Equations: SH.1, SH.4, 49.2', 'معادلات التوازن: SH.1, SH.4, 49.2', 'Formules : SH.1, SH.4, 49.2')}</span>
          </div>
        </div>
      </div>

      {bridgeBanner && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200">
              {tr(
                `Received ${bridgeBanner.count} soil test parameters from Field Data Capture. Cations and pH populated automatically.`,
                `تم استقبال ${bridgeBanner.count} قيماً من سجل الحقل. تم تحديث الكاتيونات ودرجة الحموضة بنجاح.`,
                `${bridgeBanner.count} valeurs reçues et intégrées avec succès.`
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBridgeBanner(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preset Target Info Box */}
      {preset && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="h-4 w-4 text-emerald-600" />
              <span>{preset.emoji} {preset.name} — {tr('Target Base Saturation Benchmark', 'النسب المرجعية للتشبع القاعدي', 'Cible de saturation en bases')}</span>
            </div>
            <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300">
              {tr('Agronomic Reference', 'مرجع زراعي', 'Référence')}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-background/80 p-3 text-center shadow-xs">
              <div className="text-[11px] text-muted-foreground font-medium">Ca²⁺ Target</div>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {preset.amendment.targetPct.ca}%
              </div>
            </div>
            <div className="rounded-xl border bg-background/80 p-3 text-center shadow-xs">
              <div className="text-[11px] text-muted-foreground font-medium">Mg²⁺ Target</div>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {preset.amendment.targetPct.mg}%
              </div>
            </div>
            <div className="rounded-xl border bg-background/80 p-3 text-center shadow-xs">
              <div className="text-[11px] text-muted-foreground font-medium">K⁺ Target</div>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {preset.amendment.targetPct.k}%
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed bg-white/40 dark:bg-black/20 p-2.5 rounded-lg">
            {preset.amendment.notes}
          </p>
        </div>
      )}

      {/* Main Grid: Cation Lab Inputs + Soil Physics + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cation Analysis & Soil Parameters */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-600" />
                  {tr('Exchangeable Cations in Soil Test', 'الكاتيونات المتبادلة في التحليل المخبري', 'Cations Échangeables du Sol')}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-semibold">Total CEC:</span>
                  <Badge variant="outline" className="font-mono text-sm font-black bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300">
                    {cic.toFixed(2)} meq/100g
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Cation Inputs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {cations.map((c) => {
                  const val = parsed[c];
                  const pct = cic > 0 ? (val / cic) * 100 : 0;
                  const range = IDEAL_CATION_RANGES[c];
                  const status =
                    val === 0 ? 'none' : pct < range.min ? 'low' : pct > range.max ? 'high' : 'ok';
                  const badgeColor =
                    status === 'ok'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                      : status === 'low'
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                      : status === 'high'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-muted text-muted-foreground';

                  return (
                    <div key={c} className="p-2.5 rounded-xl border bg-card text-center space-y-1.5 shadow-xs">
                      <Label className="text-[11px] font-bold text-foreground">
                        {CATION_LABELS[c].ion}
                      </Label>
                      <Input
                        value={initial[c]}
                        onChange={(e) => setInitial((p) => ({ ...p, [c]: e.target.value }))}
                        className="h-8 text-xs text-center font-mono font-bold"
                        step="0.01"
                        type="number"
                      />
                      <div className="text-[10px] text-muted-foreground">meq/100g</div>
                      <Badge variant="outline" className={`text-[10px] font-mono font-bold w-full justify-center ${badgeColor}`}>
                        {pct.toFixed(1)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* Physical Soil Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border text-xs">
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {tr('Bulk Density (g/cm³)', 'الكثافة الظاهرية (غ/سم³)', 'Densité apparente')}
                  </Label>
                  <Input
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                    type="number"
                    step="0.05"
                    className="h-8 mt-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {tr('Effective Depth (cm)', 'عمق الجذور (سم)', 'Profondeur (cm)')}
                  </Label>
                  <Input
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    type="number"
                    step="5"
                    className="h-8 mt-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {tr('Soil pH (H₂O)', 'درجة الحموضة pH', 'pH du sol')}
                  </Label>
                  <Input
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    type="number"
                    step="0.1"
                    className="h-8 mt-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {tr('Field Area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')}
                  </Label>
                  <Input
                    value={fieldAreaHa}
                    onChange={(e) => setFieldAreaHa(e.target.value)}
                    type="number"
                    step="1"
                    className="h-8 mt-1 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {phN > 0 && (
                <div
                  className="p-3 rounded-xl border text-xs font-medium flex items-center justify-between"
                  style={{ backgroundColor: `${phInd.color}15`, borderColor: `${phInd.color}40` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: phInd.color }} />
                    <span className="font-bold">{tr('Soil Reaction Diagnosis:', 'تشخيص تفاعل التربة:', 'Diagnostic pH :')}</span>
                    <span>{phInd.label} (pH {phN})</span>
                  </div>
                  <Badge variant="outline" style={{ borderColor: phInd.color, color: phInd.color }}>
                    {phN < 6.0 ? tr('Acidic - Needs Lime', 'حامضية - تحتاج جير', 'Acide') : phN > 7.8 ? tr('Alkaline - Gypsum preferred', 'قلوية - يفضل الجبس', 'Alcalin') : tr('Optimal Buffering', 'مثالية ومتوازنة', 'Optimal')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Amendment Strategy & Commercial Product Orders */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-xs rounded-2xl overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-emerald-50 via-background to-teal-50/50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  {tr('Soil Amendment Prescription Plan', 'خطة وتوصيات المحسنات الزراعية', 'Plan de Prescription des Amendements')}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
              {strategy.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl my-auto space-y-2">
                  <Check className="h-8 w-8 text-emerald-600/70" />
                  <div className="font-bold text-sm text-foreground">
                    {tr('Cation Exchange Equilibrium Achieved', 'التربة متوازنة كاتيونيّاً ولا تتطلب محسنات', 'Équilibre Cationique Atteint')}
                  </div>
                  <p className="text-xs max-w-xs">
                    {tr(
                      'Base saturation percentages for Ca, Mg, and K are within ideal agronomic ranges.',
                      'نسب التشبع بالكالسيوم والمغنيسيوم والبوتاسيوم تقع ضمن الحدود المثالية.',
                      'Les taux de saturation en Ca, Mg et K sont conformes aux normes agronomiques.'
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-[11px] text-muted-foreground uppercase">
                          <th className="py-2 text-start">{tr('Amendment Product', 'المحسن الزراعي', 'Amendement')}</th>
                          <th className="py-2 text-end">{tr('Dose (kg/ha)', 'المعدل (كغ/هـ)', 'Dose (kg/ha)')}</th>
                          <th className="py-2 text-end">{tr(`Total (${areaN} ha)`, `الإجمالي (${areaN} هـ)`, `Total (${areaN} ha)`)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {strategy.map((s, i) => (
                          <tr key={i} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2.5">
                              <div className="font-bold text-foreground">{s.amendment.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-muted-foreground">{s.amendment.formula}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                                  {s.formulaCode}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-2.5 text-end font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                              {(s.dosis * factor).toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">kg</span>
                            </td>
                            <td className="py-2.5 text-end font-mono font-bold text-foreground">
                              {(((s.dosis * factor * areaN) / 1000)).toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">t</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1 text-foreground font-semibold">
                      <Info className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{tr('Application Guidance:', 'إرشادات التطبيق الزراعي:', 'Conseils d’épandage :')}</span>
                    </div>
                    <p>
                      {tr(
                        'Incorporate amendments during deep tillage 4–6 weeks before planting to ensure complete ionic exchange in the root zone.',
                        'انثر المحسنات واخلطها مع الحراثة العميقة قبل 4 إلى 6 أسابيع من الزراعة لضمان التبادل الأيوني الفعال.',
                        'Enfouir les amendements par un labour profond 4 à 6 semaines avant le semis pour optimiser l’échange cationique.'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
