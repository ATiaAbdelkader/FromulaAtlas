'use client';

import { useState, useMemo } from 'react';
import { Bug, Copy, Check, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

interface WeatherInput { temp: string; rh: string; leafWetness: string; rain: string; }

const MODEL_AR: Record<string, string> = {
  'Late Blight (Blitecast)': 'اللفحة المتأخرة (Blitecast)',
  'Early Blight (TOMCAST)': 'اللفحة المبكرة (TOMCAST)',
  'Apple Scab (Mills)': 'جرب التفاح (Mills)',
  'Fusarium Head Blight': 'لفحة رأس الفيوزاريوم',
  'Downy Mildew (ONSET)': 'البياض الزغبي (ONSET)',
};
const MODEL_FR: Record<string, string> = {
  'Late Blight (Blitecast)': 'Mildiou tardif (Blitecast)',
  'Early Blight (TOMCAST)': 'Mildiou précoce (TOMCAST)',
  'Apple Scab (Mills)': 'Tavelure du pommier (Mills)',
  'Fusarium Head Blight': 'Fusariose de l\'épillet',
  'Downy Mildew (ONSET)': 'Mildiou (ONSET)',
};
const CROP_AR: Record<string, string> = {
  'Potato / Tomato': 'البطاطا / الطماطم',
  'Tomato / Potato': 'الطماطم / البطاطا',
  Apple: 'التفاح',
  'Wheat / Barley': 'القمح / الشعير',
  'Grape / Lettuce': 'العنب / الخس',
};
const CROP_FR: Record<string, string> = {
  'Potato / Tomato': 'Pomme de terre / Tomate',
  'Tomato / Potato': 'Tomate / Pomme de terre',
  Apple: 'Pomme',
  'Wheat / Barley': 'Blé / Orge',
  'Grape / Lettuce': 'Raisin / Laitue',
};
const RISK_AR: Record<string, string> = {
  Low: 'منخفض',
  Moderate: 'متوسط',
  'High — Spray!': 'مرتفع — رش!',
  'Infection period!': 'فترة عدوى!',
  'No infection': 'لا توجد عدوى',
  'High risk — Spray at anthesis!': 'خطر مرتفع — رش عند التزهير!',
  'Low risk': 'خطر منخفض',
  'Infection likely!': 'العدوى محتملة!',
};
const RISK_FR: Record<string, string> = {
  Low: 'Faible',
  Moderate: 'Modéré',
  'High — Spray!': 'Élevé — Traiter !',
  'Infection period!': "Période d'infection !",
  'No infection': "Pas d'infection",
  'High risk — Spray at anthesis!': 'Risque élevé — Traiter à l\'anthèse !',
  'Low risk': 'Risque faible',
  'Infection likely!': 'Infection probable !',
};
const UNIT_AR: Record<string, string> = {
  'severity values': 'وحدات شدة',
  DSV: 'وحدات شدة المرض',
  'infection event': 'حدث عدوى',
  'risk score': 'درجة خطر',
};
const UNIT_FR: Record<string, string> = {
  'severity values': 'valeurs de sévérité',
  DSV: 'DSV',
  'infection event': "événement d'infection",
  'risk score': 'score de risque',
};

const MODELS = [
  { id: 'blitecast', name: 'Late Blight (Blitecast)', crop: 'Potato / Tomato', pathogen: 'P. infestans', threshold: 18, unit: 'severity values' },
  { id: 'tomcast', name: 'Early Blight (TOMCAST)', crop: 'Tomato / Potato', pathogen: 'A. solani', threshold: 20, unit: 'DSV' },
  { id: 'mills', name: 'Apple Scab (Mills)', crop: 'Apple', pathogen: 'V. inaequalis', threshold: 1, unit: 'infection event' },
  { id: 'fhb', name: 'Fusarium Head Blight', crop: 'Wheat / Barley', pathogen: 'F. graminearum', threshold: 0.5, unit: 'risk score' },
  { id: 'downy', name: 'Downy Mildew (ONSET)', crop: 'Grape / Lettuce', pathogen: 'Plasmopara / Bremia', threshold: 1, unit: 'infection event' },
];

const TITLE: TrilingualString = {
  en: 'Disease Forecast Dashboard',
  ar: 'لوحة توقّع الأمراض',
  fr: 'Tableau de Bord des Maladies',
};

const DESC: TrilingualString = {
  en: '5 disease models · Weather-based infection risk · Spray timing',
  ar: '5 نماذج للأمراض · خطر العدوى حسب الطقس · توقيت الرش',
  fr: "5 modèles de maladies · Risque d'infection météo · Calendrier de traitement",
};

const PILL_LABEL: TrilingualString = { en: 'Select Model:', ar: 'اختر النموذج:', fr: 'Modèle :' };

export function DiseaseForecastDashboard() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [model, setModel] = useState('blitecast');
  const [weather, setWeather] = useState<WeatherInput>({ temp: '18', rh: '92', leafWetness: '14', rain: '5' });
  const [copied, setCopied] = useState(false);

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

  const handleReset = () => {
    setWeather({ temp: '18', rh: '92', leafWetness: '14', rain: '5' });
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== DISEASE FORECAST ===\nModel: ${selectedModel.name}\nCrop: ${selectedModel.crop}\nPathogen: ${selectedModel.pathogen}\nTemp: ${weather.temp}°C  RH: ${weather.rh}%  Leaf wet: ${weather.leafWetness}h  Rain: ${weather.rain}mm\n\nVerdict: ${result.riskLabel}\nRisk score: ${result.risk.toFixed(1)}\nSpray now? ${result.spray ? 'YES' : 'NO'}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = MODELS.map(m => ({
    key: m.id,
    label: isAr ? MODEL_AR[m.name] ?? m.name : isFr ? MODEL_FR[m.name] ?? m.name : m.name,
  }));

  const riskTileColor: 'rose' | 'emerald' | 'default' = result
    ? (result.spray ? 'rose' : 'emerald')
    : 'default';

  return (
    <CalculatorShell
      icon={Bug}
      title={TITLE}
      description={DESC}
      badge="IPM Decision"
      accent="rose"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={pills}
      activePill={model}
      onPillClick={(k) => setModel(k)}
      pillLabel={PILL_LABEL}
      protocolNote={{
        en: `${selectedModel.name}: threshold ${selectedModel.threshold} ${selectedModel.unit}. Install leaf wetness sensor at canopy height for accurate data. Use 7-day weather forecast for proactive planning.`,
        ar: `${MODEL_AR[selectedModel.name] ?? selectedModel.name}: العتبة ${selectedModel.threshold} ${UNIT_AR[selectedModel.unit] ?? selectedModel.unit}. ثبّت مستشعر بلل الأوراق على ارتفاع المجموع الخضري للحصول على بيانات دقيقة. استخدم توقّع الطقس لسبعة أيام للتخطيط الاستباقي.`,
        fr: `${MODEL_FR[selectedModel.name] ?? selectedModel.name}: seuil ${selectedModel.threshold} ${UNIT_FR[selectedModel.unit] ?? selectedModel.unit}. Installez un capteur d'humectation à hauteur du couvert. Utilisez les prévisions à 7 jours pour anticiper.`,
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {tr('Weather observations', 'رصد الطقس', 'Observations météo')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Temp (°C)', 'الحرارة (°م)', 'Température (°C)')}
              value={weather.temp}
              onChange={(v) => setWeather({ ...weather, temp: v })}
              step="0.5"
            />
            <CalculatorShell.InputField
              label={tr('RH (%)', 'الرطوبة النسبية (%)', 'HR (%)')}
              value={weather.rh}
              onChange={(v) => setWeather({ ...weather, rh: v })}
              step="1"
            />
            <CalculatorShell.InputField
              label={tr('Leaf wet (hr)', 'بلل الأوراق (ساعة)', 'Humectation (h)')}
              value={weather.leafWetness}
              onChange={(v) => setWeather({ ...weather, leafWetness: v })}
              step="0.5"
            />
            <CalculatorShell.InputField
              label={tr('Rain (mm)', 'المطر (ملم)', 'Pluie (mm)')}
              value={weather.rain}
              onChange={(v) => setWeather({ ...weather, rain: v })}
              step="1"
            />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            <div><span className="font-bold text-foreground">{tr('Model:', 'النموذج:', 'Modèle :')}</span> {tr(selectedModel.name, MODEL_AR[selectedModel.name] ?? selectedModel.name, MODEL_FR[selectedModel.name] ?? selectedModel.name)}</div>
            <div><span className="font-bold text-foreground">{tr('Pathogen:', 'الممرض:', 'Pathogène :')}</span> {selectedModel.pathogen}</div>
            <div><span className="font-bold text-foreground">{tr('Crop:', 'المحصول:', 'Culture :')}</span> {tr(selectedModel.crop, CROP_AR[selectedModel.crop] ?? selectedModel.crop, CROP_FR[selectedModel.crop] ?? selectedModel.crop)}</div>
            <div><span className="font-bold text-foreground">{tr('Threshold:', 'العتبة:', 'Seuil :')}</span> {selectedModel.threshold} {tr(selectedModel.unit, UNIT_AR[selectedModel.unit] ?? selectedModel.unit, UNIT_FR[selectedModel.unit] ?? selectedModel.unit)}</div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result ? (
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
            <div
              className="rounded-xl border p-5 text-center"
              style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}
            >
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tr(selectedModel.name, MODEL_AR[selectedModel.name] ?? selectedModel.name, MODEL_FR[selectedModel.name] ?? selectedModel.name)}
              </div>
              <div className="mt-1 text-3xl font-bold leading-tight" style={{ color: result.color }}>
                {tr(result.riskLabel, RISK_AR[result.riskLabel] ?? result.riskLabel, RISK_FR[result.riskLabel] ?? result.riskLabel)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {tr('Risk score:', 'درجة الخطر:', 'Score de risque :')} {result.risk.toFixed(1)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Risk score', 'درجة الخطر', 'Score de risque')}
                value={result.risk.toFixed(1)}
                unit={`/ ${selectedModel.threshold}`}
                color={riskTileColor}
              />
              <CalculatorShell.MetricTile
                label={tr('Spray decision', 'قرار الرش', 'Décision')}
                value={result.spray ? tr('SPRAY', 'رُش', 'TRAITER') : tr('WAIT', 'انتظر', 'ATTENDRE')}
                color={result.spray ? 'rose' : 'emerald'}
              />
            </div>

            {result.spray ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('SPRAY NOW.', 'رُش الآن.', 'TRAITER MAINTENANT.')}</strong>{' '}
                  {tr(
                    `Apply protectant fungicide within 24 hr. ${selectedModel.crop} at risk.`,
                    `طبّق مبيداً فطرياً وقائياً خلال 24 ساعة. ${CROP_AR[selectedModel.crop] ?? selectedModel.crop} معرّض للخطر.`,
                    `Appliquez un fongicide protecteur sous 24 h. ${CROP_FR[selectedModel.crop] ?? selectedModel.crop} à risque.`,
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('No spray needed.', 'لا حاجة إلى الرش.', 'Pas de traitement nécessaire.')}</strong>{' '}
                  {tr(
                    "Conditions don't favor infection. Monitor weather forecast.",
                    'الظروف لا تشجع على العدوى. راقب توقّع الطقس.',
                    "Les conditions ne favorisent pas l'infection. Surveillez les prévisions.",
                  )}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            {tr('Enter temperature to see risk.', 'أدخل الحرارة لعرض الخطر.', 'Saisissez la température pour voir le risque.')}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
