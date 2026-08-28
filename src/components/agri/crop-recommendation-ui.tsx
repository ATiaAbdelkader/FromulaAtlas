'use client';

/**
 * Crop Recommendation Engine UI — adapted from AgroAI's crop recommendation
 * interface. Lets farmers input their soil test results and get top-3
 * crop recommendations with confidence scores + explanations.
 *
 * Also includes "Can I grow X?" reverse recommendation.
 *
 * Trilingual (EN/FR/AR).
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, CheckCircle2, AlertTriangle, TrendingUp, Wrench, Droplets } from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import {
  recommendCrops, checkCropFeasibility, ALGERIAN_CROP_PROFILES,
  type FarmConditions, type CropRecommendation, type ReverseRecommendation,
} from '@/lib/crop-recommendation-engine';
import { SOIL_PROFILES } from '@/lib/soil-profiles';
import { cn } from '@/lib/utils';

export function CropRecommendationEngine() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  // Input state
  const [nitrogen, setNitrogen] = useState('120');
  const [phosphorus, setPhosphorus] = useState('60');
  const [potassium, setPotassium] = useState('140');
  const [ph, setPh] = useState('7.0');
  const [ec, setEc] = useState('1000');
  const [temperature, setTemperature] = useState('22');
  const [humidity, setHumidity] = useState('60');
  const [rainfall, setRainfall] = useState('500');
  const [soilTypeId, setSoilTypeId] = useState('alluvial');

  // Results
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [reverseResult, setReverseResult] = useState<ReverseRecommendation | null>(null);
  const [reverseCropId, setReverseCropId] = useState('wheat');

  const conditions: FarmConditions = useMemo(() => ({
    nitrogen: parseFloat(nitrogen) || 0,
    phosphorus: parseFloat(phosphorus) || 0,
    potassium: parseFloat(potassium) || 0,
    ph: parseFloat(ph) || 7,
    ec: parseFloat(ec) || 0,
    temperature: parseFloat(temperature) || 20,
    humidity: parseFloat(humidity) || 50,
    rainfall: parseFloat(rainfall) || 0,
    soilTypeId,
  }), [nitrogen, phosphorus, potassium, ph, ec, temperature, humidity, rainfall, soilTypeId]);

  const runRecommendation = () => {
    setRecommendations(recommendCrops(conditions, 3));
    setReverseResult(null);
  };

  const runReverse = () => {
    setReverseResult(checkCropFeasibility(reverseCropId, conditions));
    setRecommendations([]);
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Input form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            {tr('Soil & Climate Conditions', 'ظروف التربة والمناخ', 'Conditions du sol et du climat')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <Label className="text-[10px]">N (mg/kg)</Label>
              <Input value={nitrogen} onChange={(e) => setNitrogen(e.target.value)} type="number" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">P (mg/kg)</Label>
              <Input value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} type="number" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">K (mg/kg)</Label>
              <Input value={potassium} onChange={(e) => setPotassium(e.target.value)} type="number" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">pH</Label>
              <Input value={ph} onChange={(e) => setPh(e.target.value)} type="number" step="0.1" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">EC (μS/cm)</Label>
              <Input value={ec} onChange={(e) => setEc(e.target.value)} type="number" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">{tr('Temp (°C)', 'الحرارة (°م)', 'Temp (°C)')}</Label>
              <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} type="number" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">{tr('Humidity (%)', 'الرطوبة (%)', 'Humidité (%)')}</Label>
              <Input value={humidity} onChange={(e) => setHumidity(e.target.value)} type="number" className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">{tr('Rainfall (mm)', 'الأمطار (مم)', 'Pluie (mm)')}</Label>
              <Input value={rainfall} onChange={(e) => setRainfall(e.target.value)} type="number" className="h-9 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">{tr('Soil type', 'نوع التربة', 'Type de sol')}</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {SOIL_PROFILES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSoilTypeId(s.id)}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full border transition-all flex items-center gap-1',
                    soilTypeId === s.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card border-border hover:border-emerald-400'
                  )}
                >
                  <span>{s.emoji}</span>
                  {language === 'ar' ? s.nameAr : language === 'fr' ? s.nameFr : s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={runRecommendation} className="gap-1.5 flex-1">
              <Sparkles className="h-3.5 w-3.5" />
              {tr('Recommend crops', 'اقترح المحاصيل', 'Recommander des cultures')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reverse recommendation */}
      <Card className="border-violet-200 dark:border-violet-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            {tr('Can I grow X here?', 'هل يمكنني زراعة X؟', 'Puis-je cultiver X ici ?')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {ALGERIAN_CROP_PROFILES.map(c => (
              <button
                key={c.cropId}
                onClick={() => setReverseCropId(c.cropId)}
                className={cn(
                  'text-xs px-2 py-1 rounded-full border transition-all flex items-center gap-1',
                  reverseCropId === c.cropId ? 'bg-violet-600 text-white border-violet-600' : 'bg-card border-border hover:border-violet-400'
                )}
              >
                <span>{c.emoji}</span>
                {language === 'ar' ? c.cropNameAr : c.cropName}
              </button>
            ))}
          </div>
          <Button onClick={runReverse} variant="outline" className="gap-1.5 w-full">
            <TrendingUp className="h-3.5 w-3.5" />
            {tr('Check feasibility', 'تحقّق من الجدوى', 'Vérifier la faisabilité')}
          </Button>
        </CardContent>
      </Card>

      {/* Results — recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tr('Top 3 Recommended Crops', 'أفضل 3 محاصيل مقترحة', 'Top 3 cultures recommandées')}
          </div>
          {recommendations.map((rec, i) => {
            const pct = Math.round(rec.confidence * 100);
            const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#f59e0b' : '#dc2626';
            return (
              <Card key={rec.crop.cropId}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}20` }}>
                      <span className="text-xl">{rec.crop.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {i + 1}. {language === 'ar' ? rec.crop.cropNameAr : rec.crop.cropName}
                        </span>
                        <Badge variant="outline" className="text-[9px]" style={{ color, borderColor: color }}>
                          {pct}% {tr('match', 'تطابق', 'match')}
                        </Badge>
                      </div>
                      {/* Confidence bar */}
                      <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{rec.explanation}</p>
                      {rec.advantages.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {rec.advantages.slice(0, 3).map((a, j) => (
                            <div key={j} className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-start gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5 shrink-0 mt-0.5" />{a}
                            </div>
                          ))}
                        </div>
                      )}
                      {rec.issues.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {rec.issues.slice(0, 3).map((iss, j) => (
                            <div key={j} className="text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1">
                              <AlertTriangle className="h-2.5 w-2.5 shrink-0 mt-0.5" />{iss}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Results — reverse */}
      {reverseResult && (
        <Card className={reverseResult.feasible ? 'border-emerald-300' : 'border-red-300'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-xl">{reverseResult.crop.emoji}</span>
              {language === 'ar' ? reverseResult.crop.cropNameAr : reverseResult.crop.cropName}
              <Badge variant="outline" className={cn('text-[9px]', reverseResult.feasible ? 'border-emerald-400 text-emerald-700' : 'border-red-400 text-red-700')}>
                {reverseResult.feasible ? tr('Feasible', 'ممكن', 'Faisable') : tr('Challenging', 'صعب', 'Difficile')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {/* Confidence bar */}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>{tr('Yield potential', 'إمكانات الإنتاج', 'Potentiel de rendement')}</span>
                <span>{Math.round(reverseResult.yieldImpact * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${reverseResult.yieldImpact * 100}%`,
                  background: reverseResult.yieldImpact > 0.7 ? '#16a34a' : reverseResult.yieldImpact > 0.4 ? '#f59e0b' : '#dc2626'
                }} />
              </div>
            </div>

            {reverseResult.advantages.length > 0 && (
              <div>
                <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />{tr('Advantages', 'المزايا', 'Avantages')}
                </div>
                <ul className="space-y-0.5">
                  {reverseResult.advantages.map((a, i) => <li key={i} className="text-emerald-700 dark:text-emerald-400">• {a}</li>)}
                </ul>
              </div>
            )}

            {reverseResult.issues.length > 0 && (
              <div>
                <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />{tr('Issues', 'المشاكل', 'Problèmes')}
                </div>
                <ul className="space-y-0.5">
                  {reverseResult.issues.map((iss, i) => <li key={i} className="text-amber-700 dark:text-amber-400">• {iss}</li>)}
                </ul>
              </div>
            )}

            {reverseResult.amendments.length > 0 && (
              <div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                  <Wrench className="h-3 w-3" />{tr('Required amendments', 'التعديلات المطلوبة', 'Amendements requis')}
                </div>
                <ul className="space-y-0.5">
                  {reverseResult.amendments.map((a, i) => <li key={i} className="text-blue-700 dark:text-blue-400">→ {a}</li>)}
                </ul>
              </div>
            )}

            {reverseResult.irrigationNeeded && (
              <div className="rounded-lg border border-cyan-300 bg-cyan-50 dark:bg-cyan-950/20 p-2 flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
                <Droplets className="h-3.5 w-3.5" />
                {tr('Irrigation required — rainfall is insufficient for this crop.', 'الري مطلوب — الأمطار غير كافية لهذا المحصول.', 'Irrigation nécessaire — les précipitations sont insuffisantes.')}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
