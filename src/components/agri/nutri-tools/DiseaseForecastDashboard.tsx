'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, AlertTriangle, CheckCircle2, CloudRain } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

interface WeatherInput { temp: string; rh: string; leafWetness: string; rain: string; }

const MODEL_AR: Record<string, string> = {
  'Late Blight (Blitecast)': 'اللفحة المتأخرة (Blitecast)', 'Early Blight (TOMCAST)': 'اللفحة المبكرة (TOMCAST)', 'Apple Scab (Mills)': 'جرب التفاح (Mills)', 'Fusarium Head Blight': 'لفحة رأس الفيوزاريوم', 'Downy Mildew (ONSET)': 'البياض الزغبي (ONSET)',
};
const CROP_AR: Record<string, string> = { 'Potato / Tomato': 'البطاطا / الطماطم', 'Tomato / Potato': 'الطماطم / البطاطا', Apple: 'التفاح', 'Wheat / Barley': 'القمح / الشعير', 'Grape / Lettuce': 'العنب / الخس' };
const RISK_AR: Record<string, string> = { Low: 'منخفض', Moderate: 'متوسط', 'High — Spray!': 'مرتفع — رش!', 'Infection period!': 'فترة عدوى!', 'No infection': 'لا توجد عدوى', 'High risk — Spray at anthesis!': 'خطر مرتفع — رش عند التزهير!', 'Low risk': 'خطر منخفض', 'Infection likely!': 'العدوى محتملة!', };
const UNIT_AR: Record<string, string> = { 'severity values': 'وحدات شدة', DSV: 'وحدات شدة المرض', 'infection event': 'حدث عدوى', 'risk score': 'درجة خطر' };

const MODELS = [
  { id: 'blitecast', name: 'Late Blight (Blitecast)', crop: 'Potato / Tomato', pathogen: 'P. infestans', threshold: 18, unit: 'severity values' },
  { id: 'tomcast', name: 'Early Blight (TOMCAST)', crop: 'Tomato / Potato', pathogen: 'A. solani', threshold: 20, unit: 'DSV' },
  { id: 'mills', name: 'Apple Scab (Mills)', crop: 'Apple', pathogen: 'V. inaequalis', threshold: 1, unit: 'infection event' },
  { id: 'fhb', name: 'Fusarium Head Blight', crop: 'Wheat / Barley', pathogen: 'F. graminearum', threshold: 0.5, unit: 'risk score' },
  { id: 'downy', name: 'Downy Mildew (ONSET)', crop: 'Grape / Lettuce', pathogen: 'Plasmopara / Bremia', threshold: 1, unit: 'infection event' },
];

export function DiseaseForecastDashboard() {
  const { language } = useTranslation();
  const [model, setModel] = useState('blitecast');
  const [weather, setWeather] = useState<WeatherInput>({ temp: '18', rh: '92', leafWetness: '14', rain: '5' });

  const result = useMemo(() => {
    const T = parseFloat(weather.temp);
    const RH = parseFloat(weather.rh);
    const LW = parseFloat(weather.leafWetness);
    const rain = parseFloat(weather.rain);
    if (!Number.isFinite(T)) return null;

    let risk = 0, riskLabel = 'Low', color = '#10b981', spray = false;

    if (model === 'blitecast') {
      if (RH >= 90 && LW >= 10) {
        risk = Math.min(4, Math.max(0, (T - 7) * 0.3));
      }
      spray = risk >= 3;
      riskLabel = risk >= 3 ? 'High — Spray!' : risk >= 1.5 ? 'Moderate' : 'Low';
      color = risk >= 3 ? '#dc2626' : risk >= 1.5 ? '#f59e0b' : '#10b981';
    } else if (model === 'tomcast') {
      if (LW >= 4) {
        risk = Math.min(4, T > 13 && T < 28 ? LW * 0.3 : 0);
      }
      spray = risk >= 3;
      riskLabel = risk >= 3 ? 'High — Spray!' : risk >= 1.5 ? 'Moderate' : 'Low';
      color = risk >= 3 ? '#dc2626' : risk >= 1.5 ? '#f59e0b' : '#10b981';
    } else if (model === 'mills') {
      const wetnessNeeded = T < 7 ? 18 : T < 10 ? 14 : T < 16 ? 11 : T < 20 ? 9 : 13;
      risk = LW >= wetnessNeeded ? 1 : 0;
      spray = risk === 1;
      riskLabel = risk === 1 ? 'Infection period!' : 'No infection';
      color = risk === 1 ? '#dc2626' : '#10b981';
    } else if (model === 'fhb') {
      risk = (T >= 15 && T <= 30 && RH > 80 && rain > 5) ? 1 : 0;
      spray = risk === 1;
      riskLabel = risk === 1 ? 'High risk — Spray at anthesis!' : 'Low risk';
      color = risk === 1 ? '#dc2626' : '#10b981';
    } else if (model === 'downy') {
      risk = (T >= 4 && T <= 25 && RH >= 90 && LW >= 4) ? 1 : 0;
      spray = risk === 1;
      riskLabel = risk === 1 ? 'Infection likely!' : 'No infection';
      color = risk === 1 ? '#dc2626' : '#10b981';
    }

    return { risk, riskLabel, color, spray };
  }, [model, weather]);

  const selectedModel = MODELS.find(m => m.id === model)!;

  return (
    <Card className="overflow-hidden border-rose-200/60 shadow-sm dark:border-rose-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 via-background to-sky-50/40 pb-4 dark:from-rose-950/30 dark:via-background dark:to-sky-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bug className="h-4 w-4 text-rose-600" /> {copyFor(language, 'Disease Forecast Dashboard', 'لوحة توقّع الأمراض')}
        </CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, '5 disease models · Weather-based infection risk · Spray timing', '5 نماذج للأمراض · خطر العدوى حسب الطقس · توقيت الرش')}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="rounded-xl border bg-muted/20 p-3">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Disease model', 'نموذج المرض')}</Label>
          <select value={model} onChange={e => setModel(e.target.value)} aria-label={copyFor(language, 'Disease model', 'نموذج المرض')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {MODELS.map(m => <option key={m.id} value={m.id}>{copyFor(language, m.name, MODEL_AR[m.name] ?? m.name)} — {copyFor(language, m.crop, CROP_AR[m.crop] ?? m.crop)}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Temp (°C)', 'الحرارة (°م)')}</Label>
            <Input value={weather.temp} onChange={e => setWeather({ ...weather, temp: e.target.value })} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'RH (%)', 'الرطوبة النسبية (%)')}</Label>
            <Input value={weather.rh} onChange={e => setWeather({ ...weather, rh: e.target.value })} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Leaf wet (hr)', 'بلل الأوراق (ساعة)')}</Label>
            <Input value={weather.leafWetness} onChange={e => setWeather({ ...weather, leafWetness: e.target.value })} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Rain (mm)', 'المطر (ملم)')}</Label>
            <Input value={weather.rain} onChange={e => setWeather({ ...weather, rain: e.target.value })} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-5 text-center shadow-sm" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, selectedModel.name, MODEL_AR[selectedModel.name] ?? selectedModel.name)}</div>
              <div className="mt-1 text-3xl font-bold leading-tight" style={{ color: result.color }}>{copyFor(language, result.riskLabel, RISK_AR[result.riskLabel] ?? result.riskLabel)}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {copyFor(language, 'Risk score:', 'درجة الخطر:')} {result.risk.toFixed(1)} · {copyFor(language, 'Pathogen:', 'الممرض:')} {selectedModel.pathogen}
              </div>
            </div>

            {result.spray ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'SPRAY NOW.', 'رُش الآن.')}</strong> {copyFor(language, `Apply protectant fungicide within 24 hr. ${selectedModel.crop} at risk.`, `طبّق مبيداً فطرياً وقائياً خلال 24 ساعة. ${CROP_AR[selectedModel.crop] ?? selectedModel.crop} معرّض للخطر.`)}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'No spray needed.', 'لا حاجة إلى الرش.')}</strong> {copyFor(language, "Conditions don't favor infection. Monitor weather forecast.", 'الظروف لا تشجع على العدوى. راقب توقّع الطقس.')}</span>
              </div>
            )}

            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              {copyFor(language, `${selectedModel.name}: threshold ${selectedModel.threshold} ${selectedModel.unit}. Install leaf wetness sensor at canopy height for accurate data. Use 7-day weather forecast for proactive planning.`, `${MODEL_AR[selectedModel.name] ?? selectedModel.name}: العتبة ${selectedModel.threshold} ${UNIT_AR[selectedModel.unit] ?? selectedModel.unit}. ثبّت مستشعر بلل الأوراق على ارتفاع المجموع الخضري للحصول على بيانات دقيقة. استخدم توقّع الطقس لسبعة أيام للتخطيط الاستباقي.`)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
