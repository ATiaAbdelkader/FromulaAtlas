'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Snowflake, Wind, Droplets, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const METHOD_AR: Record<string, string> = { sprinkler: 'رشاشات علوية', windmachine: 'آلة رياح', smudge: 'أوعية تدخين' };
const FROST_TYPE_AR: Record<string, string> = { 'Advective (wind)': 'إشعاعي-حمل (رياح)', 'Radiative (calm)': 'إشعاعي (سكون)', 'No frost': 'لا يوجد صقيع' };

export function FrostProtectionCalculator() {
  const { language } = useTranslation();
  const [temp, setTemp] = useState('0');
  const [dewPoint, setDewPoint] = useState('-3');
  const [windSpeed, setWindSpeed] = useState('3');
  const [area, setArea] = useState('5');
  const [method, setMethod] = useState('sprinkler');

  const result = useMemo(() => {
    const T = parseFloat(temp), DP = parseFloat(dewPoint), WS = parseFloat(windSpeed), A = parseFloat(area);
    if (!Number.isFinite(T)) return null;

    // Frost risk: temp below 2°C + low dew point + calm wind = radiative frost
    const isFrost = T <= 2;
    const isAdvective = WS > 5; // advective frost = windy, harder to protect
    const inversionStrength = T - DP; // larger = drier = colder burn potential

    let sprinklerRate = 0, sprinklerFlow = 0;
    if (method === 'sprinkler') {
      // Application rate depends on temp + wind (USDA NRCS method)
      sprinklerRate = Math.max(2.5, (2 - T) * 1.5 + (WS > 2 ? 2 : 0)); // mm/hr
      sprinklerFlow = sprinklerRate * A * 10; // m³/hr (mm/hr × ha × 10)
    }

    let windMachineCoverage = 0;
    if (method === 'windmachine') {
      windMachineCoverage = WS < 3 ? 2.5 : 1.5; // ha per machine (less effective in wind)
    }

    let smudgePotCount = 0;
    if (method === 'smudge') {
      smudgePotCount = Math.ceil(A * (isAdvective ? 60 : 40)); // pots/ha
    }

    const canProtect = !isAdvective || method === 'sprinkler';
    const effectiveness = isAdvective ? 30 : 70; // %

    return { isFrost, isAdvective, inversionStrength, sprinklerRate, sprinklerFlow, windMachineCoverage, smudgePotCount, canProtect, effectiveness };
  }, [temp, dewPoint, windSpeed, area, method]);

  return (
    <Card className="overflow-hidden border-blue-200/60 shadow-sm dark:border-blue-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-background to-cyan-50/40 pb-4 dark:from-blue-950/30 dark:via-background dark:to-cyan-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <Snowflake className="h-4 w-4 text-blue-600" /> {copyFor(language, 'Frost Protection Calculator', 'حاسبة الحماية من الصقيع')}
        </CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Radiative vs advective frost · sprinkler / wind machine / smudge pot sizing', 'الصقيع الإشعاعي مقابل الحملي · تحجيم الرشاشات وآلات الرياح وأوعية التدخين')}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Temp (°C)', 'الحرارة (°م)')}</Label>
            <Input value={temp} onChange={e => setTemp(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Dew point (°C)', 'نقطة الندى (°م)')}</Label>
            <Input value={dewPoint} onChange={e => setDewPoint(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Wind (km/h)', 'الرياح (كم/ساعة)')}</Label>
            <Input value={windSpeed} onChange={e => setWindSpeed(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Area (ha)', 'المساحة (هكتار)')}</Label>
            <Input value={area} onChange={e => setArea(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Protection method', 'طريقة الحماية')}</Label>
          <select value={method} onChange={e => setMethod(e.target.value)} aria-label={copyFor(language, 'Protection method', 'طريقة الحماية')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="sprinkler">💧 {copyFor(language, 'Overhead sprinkler', METHOD_AR.sprinkler)}</option>
            <option value="windmachine">🌀 {copyFor(language, 'Wind machine', METHOD_AR.windmachine)}</option>
            <option value="smudge">🔥 {copyFor(language, 'Smudge pots', METHOD_AR.smudge)}</option>
          </select>
        </div>
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className={`rounded-xl border p-3 shadow-sm ${result.isFrost ? 'border-blue-300 bg-blue-50/40' : 'border-emerald-300 bg-emerald-50/40'}`}>
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Frost type', 'نوع الصقيع')}</div>
                <div className="mt-1 text-base font-bold">{copyFor(language, result.isFrost ? (result.isAdvective ? 'Advective (wind)' : 'Radiative (calm)') : 'No frost', FROST_TYPE_AR[result.isFrost ? (result.isAdvective ? 'Advective (wind)' : 'Radiative (calm)') : 'No frost'])}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Effectiveness', 'الفعالية')}</div>
                <div className={`mt-1 text-2xl font-bold ${result.effectiveness > 50 ? 'text-emerald-600' : 'text-rose-600'}`}>{result.effectiveness}%</div>
              </div>
            </div>

            {method === 'sprinkler' && result.isFrost && (
              <div className="space-y-2 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3 text-sm dark:border-cyan-900 dark:bg-cyan-950/20">
                <div className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-cyan-600" /><strong>{copyFor(language, 'Sprinkler requirements:', 'متطلبات الرشاشات:')}</strong></div>
                <div>{copyFor(language, 'Application rate:', 'معدل التطبيق:')} <strong className="font-mono">{result.sprinklerRate.toFixed(1)} mm/hr</strong></div>
                <div>{copyFor(language, 'Total flow:', 'التدفق الإجمالي:')} <strong className="font-mono">{result.sprinklerFlow.toFixed(0)} m³/hr</strong> {copyFor(language, `for ${area} ha`, `لمساحة ${area} هكتار`)}</div>
                <div className="text-[10px] text-muted-foreground">{copyFor(language, 'Start sprinklers when wet-bulb temp reaches 0°C. Run continuously until ice melts next morning.', 'شغّل الرشاشات عندما تصل حرارة البصيلة الرطبة إلى 0°م. شغّلها باستمرار حتى يذوب الجليد في صباح اليوم التالي.')}</div>
              </div>
            )}
            {method === 'windmachine' && result.isFrost && (
              <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/20">
                <div className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5 text-violet-600" /><strong>{copyFor(language, 'Wind machine:', 'آلة الرياح:')}</strong></div>
                <div>{copyFor(language, 'Coverage:', 'التغطية:')} <strong className="font-mono">{result.windMachineCoverage.toFixed(1)} ha</strong> {copyFor(language, 'per machine', 'لكل آلة')}</div>
                <div>{copyFor(language, 'Need:', 'الاحتياج:')} <strong className="font-mono">{Math.ceil(parseFloat(area) / result.windMachineCoverage)} {copyFor(language, 'machines', 'آلات')}</strong> {copyFor(language, `for ${area} ha`, `لمساحة ${area} هكتار`)}</div>
                <div className="text-[10px] text-muted-foreground">{copyFor(language, 'Only works for radiative frost (inversion). Ineffective in advective frost.', 'تعمل فقط مع الصقيع الإشعاعي (الانقلاب الحراري)، وتكون غير فعالة مع الصقيع الحملي.')}</div>
              </div>
            )}
            {method === 'smudge' && result.isFrost && (
              <div className="space-y-2 rounded-xl border border-orange-200 bg-orange-50/60 p-3 text-sm dark:border-orange-900 dark:bg-orange-950/20">
                <div className="flex items-center gap-1.5"><Snowflake className="h-3.5 w-3.5 text-orange-600" /><strong>{copyFor(language, 'Smudge pots:', 'أوعية التدخين:')}</strong></div>
                <div>{copyFor(language, 'Need:', 'الاحتياج:')} <strong className="font-mono">{result.smudgePotCount} {copyFor(language, 'pots', 'أوعية')}</strong> ({result.smudgePotCount / parseFloat(area)} /ha)</div>
                <div className="text-[10px] text-muted-foreground">{copyFor(language, 'Light 1 hr before critical temp. Smoke creates heat inversion. Check local air quality regs.', 'أشعلها قبل ساعة من بلوغ الحرارة الحرجة. يخلق الدخان انقلاباً حرارياً. تحقّق من لوائح جودة الهواء المحلية.')}</div>
              </div>
            )}

            {!result.canProtect && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'Advective frost — limited protection.', 'صقيع حملي — حماية محدودة.')}</strong> {copyFor(language, "Wind >5 km/h breaks inversion. Only sprinklers effective. Wind machines won't work.", 'الرياح التي تتجاوز 5 كم/ساعة تكسر الانقلاب الحراري. الرشاشات هي الفعالة فقط، ولن تعمل آلات الرياح.')}</span>
              </div>
            )}
            {result.canProtect && result.isFrost && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'Protection feasible.', 'الحماية ممكنة.')}</strong> {copyFor(language, 'Radiative frost — inversion layer present.', 'صقيع إشعاعي — توجد طبقة انقلاب حراري.')} {method === 'sprinkler' ? copyFor(language, 'Sprinklers most effective.', 'الرشاشات هي الأكثر فعالية.') : method === 'windmachine' ? copyFor(language, 'Wind machines will mix warm air down.', 'ستخلط آلات الرياح الهواء الدافئ إلى الأسفل.') : copyFor(language, 'Smudge pots will create heat inversion.', 'ستنشئ أوعية التدخين انقلاباً حرارياً دافئاً.')}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
