'use client';

/**
 * SoilFertilityScoreWidget — a 0–100 fertility score calculator
 * that evaluates 15 soil parameters against agronomic optimum ranges.
 *
 * Each parameter is scored independently, then combined with
 * configurable weights. Shows a big gauge + per-parameter breakdown
 * + recommendations for each parameter that's below optimal.
 *
 * Can be used standalone or embedded inside other soil tools.
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sprout, RotateCcw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  calculateFertilityScore, bandColor, bandLabel, gradeColor,
  type SoilFertilityInput, type FertilityResult,
} from '@/lib/soil-fertility-score';
import { cn } from '@/lib/utils';

interface SoilFertilityScoreWidgetProps {
  /** Pre-fill from existing soil data (e.g. from SoilPhNutrientMaster) */
  initialData?: Partial<SoilFertilityInput>;
  /** Compact mode — just the gauge + score, no input form */
  compact?: boolean;
}

const INPUT_FIELDS: { key: keyof SoilFertilityInput; label: string; labelAr: string; labelFr: string; unit: string; placeholder: string }[] = [
  { key: 'ph', label: 'pH', labelAr: 'الحموضة', labelFr: 'pH', unit: '', placeholder: '7.2' },
  { key: 'organicMatterPct', label: 'Organic Matter', labelAr: 'مادة عضوية', labelFr: 'Matière org.', unit: '%', placeholder: '2.5' },
  { key: 'ecDsm', label: 'EC (Salinity)', labelAr: 'التوصيلية', labelFr: 'CE (Salinité)', unit: 'dS/m', placeholder: '1.8' },
  { key: 'nitrogenPpm', label: 'Nitrogen (N)', labelAr: 'الآزوت', labelFr: 'Azote (N)', unit: 'ppm', placeholder: '30' },
  { key: 'phosphorusPpm', label: 'Phosphorus (P)', labelAr: 'الفوسفور', labelFr: 'Phosphore (P)', unit: 'ppm', placeholder: '25' },
  { key: 'potassiumPpm', label: 'Potassium (K)', labelAr: 'البوتاسيوم', labelFr: 'Potassium (K)', unit: 'ppm', placeholder: '250' },
  { key: 'cecCmolKg', label: 'CEC', labelAr: 'سعة التبادل', labelFr: 'CEC', unit: 'cmol/kg', placeholder: '18' },
  { key: 'calciumCmolKg', label: 'Calcium (Ca)', labelAr: 'الكالسيوم', labelFr: 'Calcium (Ca)', unit: 'cmol/kg', placeholder: '12' },
  { key: 'magnesiumCmolKg', label: 'Magnesium (Mg)', labelAr: 'المغنيسيوم', labelFr: 'Magnésium (Mg)', unit: 'cmol/kg', placeholder: '3.5' },
  { key: 'zincPpm', label: 'Zinc (Zn)', labelAr: 'الزنك', labelFr: 'Zinc (Zn)', unit: 'ppm', placeholder: '2.0' },
  { key: 'ironPpm', label: 'Iron (Fe)', labelAr: 'الحديد', labelFr: 'Fer (Fe)', unit: 'ppm', placeholder: '15' },
  { key: 'boronPpm', label: 'Boron (B)', labelAr: 'البورون', labelFr: 'Bore (B)', unit: 'ppm', placeholder: '0.8' },
  { key: 'copperPpm', label: 'Copper (Cu)', labelAr: 'النحاس', labelFr: 'Cuivre (Cu)', unit: 'ppm', placeholder: '1.2' },
  { key: 'manganesePpm', label: 'Manganese (Mn)', labelAr: 'المنغنيز', labelFr: 'Manganèse (Mn)', unit: 'ppm', placeholder: '5.0' },
  { key: 'sodiumPct', label: 'Sodium (ESP)', labelAr: 'الصوديوم', labelFr: 'Sodium (ESP)', unit: '%', placeholder: '3' },
];

export function SoilFertilityScoreWidget({ initialData, compact = false }: SoilFertilityScoreWidgetProps) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  // Pre-fill from initialData
  useState(() => {
    if (initialData) {
      const prefilled: Record<string, string> = {};
      for (const [k, v] of Object.entries(initialData)) {
        if (v != null && Number.isFinite(v)) prefilled[k] = String(v);
      }
      setInputs(prefilled);
    }
  });

  const parsedInput: SoilFertilityInput = useMemo(() => {
    const result: SoilFertilityInput = {};
    for (const field of INPUT_FIELDS) {
      const val = inputs[field.key];
      if (val != null && val !== '') {
        const num = parseFloat(val);
        if (Number.isFinite(num)) {
          (result as Record<string, number>)[field.key] = num;
        }
      }
    }
    return result;
  }, [inputs]);

  const result: FertilityResult | null = useMemo(() => {
    if (Object.keys(parsedInput).length === 0) return null;
    return calculateFertilityScore(parsedInput);
  }, [parsedInput]);

  const handleReset = useCallback(() => {
    setInputs({});
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  }, [language]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const lines = result.parameters.map((p) =>
      `  ${p.emoji} ${p.name}: ${p.value}${p.unit} → ${p.score}/100 (${p.band})`
    );
    const text = `=== SOIL FERTILITY SCORE ===
Score: ${result.totalScore}/100 (Grade ${result.grade})
Band: ${result.band}
Measured: ${result.measured}/${result.total} parameters
Confidence: ${result.confidence}

Parameters:
${lines.join('\n')}

Top issues: ${result.topIssues.length > 0 ? result.topIssues.join(', ') : 'None'}

Summary: ${result.summary.en}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  }, [result, language]);

  const visibleFields = showAllFields ? INPUT_FIELDS : INPUT_FIELDS.slice(0, 9);

  if (compact && result) {
    return <CompactGauge result={result} language={language} />;
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Score Gauge */}
      {result && <ScoreGauge result={result} language={language} />}

      {/* Input fields */}
      {!compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-600" />
              {tr('Soil Parameters', 'معايير التربة', 'Paramètres du sol')}
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {result?.measured ?? 0} / {INPUT_FIELDS.length} {tr('entered', 'مُدخلة', 'saisis')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">
                    {language === 'ar' ? field.labelAr : language === 'fr' ? field.labelFr : field.label}
                    {field.unit && ` (${field.unit})`}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder={field.placeholder}
                    value={inputs[field.key] ?? ''}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              ))}
            </div>

            {INPUT_FIELDS.length > 9 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllFields(!showAllFields)}
                className="w-full mt-2 text-xs gap-1"
              >
                {showAllFields
                  ? tr('Show less', 'عرض أقل', 'Afficher moins')
                  : tr(`Show all ${INPUT_FIELDS.length} parameters`, `عرض كل ${INPUT_FIELDS.length} معايير`, `Voir les ${INPUT_FIELDS.length} paramètres`)}
                {showAllFields ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!result}
                className="gap-1.5 text-xs flex-1"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {tr('Copy Summary', 'نسخ التقرير', 'Copier')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {tr('Reset', 'إعادة', 'Réinitialiser')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameter breakdown */}
      {result && result.parameters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">
              {tr('Parameter Breakdown', 'تفصيل المعايير', 'Détail des paramètres')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.parameters
              .sort((a, b) => a.score - b.score)
              .map((param, i) => {
                const color = bandColor(param.band);
                const label = language === 'ar' ? param.nameAr : language === 'fr' ? param.nameFr : param.name;
                return (
                  <div key={i} className="rounded-lg border p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{param.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{label}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {param.value}{param.unit} {tr('vs', 'مقابل', 'vs')} {param.optimalRange}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold" style={{ color }}>{param.score}</span>
                        <Badge variant="outline" className="text-[9px]" style={{ borderColor: color, color }}>{bandLabel(param.band, language)}</Badge>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${param.score}%`, backgroundColor: color }} />
                    </div>
                    {/* Recommendation (only for non-optimal) */}
                    {param.band !== 'optimal' && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {param.recommendation[language]}
                      </p>
                    )}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Gauge — big circular gauge showing the fertility score
// ---------------------------------------------------------------------------

function ScoreGauge({ result, language }: { result: FertilityResult; language: 'en' | 'fr' | 'ar' }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const color = bandColor(result.band);
  const gradeCol = gradeColor(result.grade);

  // SVG gauge
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - result.totalScore / 100);

  return (
    <Card className={cn('border-2', result.band === 'optimal' ? 'border-emerald-300' : result.band === 'good' ? 'border-lime-300' : result.band === 'moderate' ? 'border-amber-300' : 'border-rose-300')}>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col items-center gap-3">
          {/* Circular gauge */}
          <div className="relative">
            <svg width="160" height="160" className="transform -rotate-90">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
              <circle
                cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                strokeLinecap="round" className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-black font-mono" style={{ color }}>{result.totalScore}</div>
              <div className="text-xs text-muted-foreground">{tr('/ 100', '/ 100', '/ 100')}</div>
              <div className="text-2xl font-black" style={{ color: gradeCol }}>{result.grade}</div>
            </div>
          </div>

          {/* Band label */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-bold gap-1" style={{ borderColor: color, color }}>
              {bandLabel(result.band, language)}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {result.measured}/{result.total} {tr('params', 'معايير', 'params')}
            </Badge>
            <Badge variant="outline" className={cn(
              'text-[10px]',
              result.confidence === 'high' ? 'text-emerald-700' : result.confidence === 'medium' ? 'text-amber-700' : 'text-rose-700'
            )}>
              {result.confidence === 'high' ? tr('High confidence', 'ثقة عالية', 'Confiance élevée') : result.confidence === 'medium' ? tr('Medium confidence', 'ثقة متوسطة', 'Confiance moyenne') : tr('Low confidence', 'ثقة منخفضة', 'Confiance faible')}
            </Badge>
          </div>

          {/* Summary */}
          <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-md">
            {result.summary[language]}
          </p>

          {/* Top issues */}
          {result.topIssues.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {result.topIssues.slice(0, 5).map((issue, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-rose-700 border-rose-300">
                  ⚠ {issue}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compact gauge — just the score circle + band label (for embedding)
// ---------------------------------------------------------------------------

function CompactGauge({ result, language }: { result: FertilityResult; language: 'en' | 'fr' | 'ar' }) {
  const color = bandColor(result.band);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - result.totalScore / 100);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <svg width="70" height="70" className="transform -rotate-90">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
          <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black font-mono" style={{ color }}>{result.totalScore}</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-bold" style={{ color }}>{bandLabel(result.band, language)}</div>
        <div className="text-[10px] text-muted-foreground">{result.measured}/{result.total} {language === 'ar' ? 'معيار' : language === 'fr' ? 'params' : 'params'}</div>
      </div>
    </div>
  );
}
