'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell, Loader2, AlertTriangle, AlertCircle, Info, CheckCircle2,
  CloudRain, Thermometer, Bug, Calendar, X, MapPin, RefreshCw,
} from 'lucide-react';
import { useTranslation, type Language } from '@/lib/language-store';

interface Alert {
  id: string;
  category: 'disease' | 'phenology' | 'weather';
  priority: 'low' | 'info' | 'warning' | 'action' | 'critical';
  title: string;
  message: string;
  action?: string;
  forecastDays?: number;
  riskScore?: number;
}

interface AlertsResponse {
  crop: string;
  currentWeek: number;
  totalWeeks: number;
  currentStage: string;
  alerts: Alert[];
  summary: { total: number; critical: number; action: number; warning: number; info: number };
  generatedAt: string;
}

const PRIORITY_STYLES: Record<string, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle },
  action:   { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', icon: AlertCircle },
  warning:  { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', icon: AlertCircle },
  info:     { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Info },
  low:      { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle2 },
};

const CATEGORY_ICONS = {
  disease: Bug,
  phenology: Calendar,
  weather: CloudRain,
};

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

const STAGE_AR: Record<string, string> = {
  Establishment: 'التأسيس',
  Vegetative: 'النمو الخضري',
  Flowering: 'الإزهار',
  'Fruit/Grain Fill': 'امتلاء الثمار/الحبوب',
  Maturation: 'النضج',
};

const DISEASE_AR: Record<string, string> = {
  'Late Blight (Smith Period)': 'اللفحة المتأخرة (فترة سميث)',
  'Early Blight (FAST)': 'اللفحة المبكرة (FAST)',
  'Powdery Mildew': 'البياض الدقيقي',
  Botrytis: 'البوتريتس',
  'Blossom-End Rot': 'عفن الطرف الزهري',
};

function localizeAlert(alert: Alert, language: Language): Alert {
  if (language !== 'ar') return alert;
  const stage = (value: string) => STAGE_AR[value] ?? value;
  const disease = (value: string) => DISEASE_AR[value] ?? value;
  let title = disease(alert.title);
  let message = alert.message;
  let action = alert.action;

  const frost = title.match(/^Frost risk on (.+)$/);
  const heat = title.match(/^Extreme heat on (.+)$/);
  const rain = title.match(/^Heavy rain on (.+)$/);
  const started = title.match(/^(.+) stage started$/);
  const recipe = title.match(/^Fertigation recipe: (.+)$/);
  const sample = title.match(/^Time to sample: (.+)$/);

  if (frost) title = `خطر الصقيع في ${frost[1]}`;
  else if (heat) title = `حرارة شديدة في ${heat[1]}`;
  else if (rain) title = `أمطار غزيرة في ${rain[1]}`;
  else if (started) title = `بدأت مرحلة ${stage(started[1])}`;
  else if (recipe) title = `وصفة التسميد بالري: ${stage(recipe[1])}`;
  else if (sample) title = `حان وقت أخذ العينة: ${sample[1]}`;
  else if (title === 'Peak water demand — verify irrigation') title = 'ذروة الطلب على المياه — تحقّق من الري';
  else if (title === 'Reduce N, prepare for harvest') title = 'خفّض النيتروجين واستعد للحصاد';

  message = message
    .replace(/^Your (.+) is entering the (.+) stage \(week (\d+) of (\d+)\)\. Key focus: (.+)\.$/, (_, crop, currentStage, week, total, focus) => `يدخل محصول ${crop} مرحلة ${stage(currentStage)} (الأسبوع ${week} من ${total}). التركيز الأساسي: ${focus}.`)
    .replace(/^Current recipe: (.+)$/, (_, value) => `الوصفة الحالية: ${value}`)
    .replace(/^Mid-(.+) is the optimal window for (.+)\. Results guide the next fertigation adjustment\.$/, (_, currentStage, sampling) => `منتصف مرحلة ${stage(currentStage)} هو الموعد الأنسب لـ${sampling}. وتوجّه النتائج تعديل التسميد بالري التالي.`)
    .replace(/^(.+) stage has the highest ETc\. Check that irrigation is keeping up with the forecast demand\.$/, (_, currentStage) => `تتميز مرحلة ${stage(currentStage)} بأعلى قيمة ETc. تحقّق من مواكبة الري للطلب المتوقع.`)
    .replace(/^In maturation, excess N delays ripening and reduces quality\. Cut N to near-zero\. Maintain Ca for fruit firmness\.$/, 'يؤخر فائض النيتروجين النضج ويقلل الجودة. اخفض النيتروجين إلى ما يقارب الصفر وحافظ على الكالسيوم لصلابة الثمار.')
    .replace(/^Minimum temperature forecast: ([\d.]+)°C\. Frost can damage (.+)\.$/, 'درجة الحرارة الدنيا المتوقعة: $1°م. قد يضر الصقيع بمحصول $2.')
    .replace(/^Maximum temperature forecast: ([\d.]+)°C\. Heat stress likely\.$/, 'درجة الحرارة القصوى المتوقعة: $1°م. يُحتمل حدوث إجهاد حراري.')
    .replace(/^Precipitation forecast: ([\d.]+) mm\. Risk of leaching, soil erosion, and disease spread\.$/, 'الهطول المتوقع: $1 مم. يوجد خطر غسل العناصر وانجراف التربة وانتشار الأمراض.');

  action = action
    ?.replace(/^Starter formula \(high P, e\.g\. 10-30-10\) at low rate$/, 'استخدم تركيبة بادئة عالية الفوسفور، مثل 10-30-10، بمعدل منخفض')
    .replace(/^Grow formula \(balanced N-K, e\.g\. 20-10-20\) at moderate rate$/, 'استخدم تركيبة نمو متوازنة من N-K، مثل 20-10-20، بمعدل متوسط')
    .replace(/^Bloom formula \(high K, e\.g\. 15-15-30\) at moderate rate$/, 'استخدم تركيبة إزهار عالية البوتاسيوم، مثل 15-15-30، بمعدل متوسط')
    .replace(/^Finish formula \(high K, low N, e\.g\. 12-4-26\) at peak rate$/, 'استخدم تركيبة إنهاء عالية البوتاسيوم ومنخفضة النيتروجين، مثل 12-4-26، بالمعدل الأقصى')
    .replace(/^Reduce or stop \(water only or low-rate finish\)$/, 'خفّض التسميد أو أوقفه؛ استخدم الماء فقط أو تركيبة إنهاء منخفضة المعدل')
    .replace(/^Collect (.+) this week$/, 'اجمع عينة $1 هذا الأسبوع')
    .replace(/^Use the Irrigation Balance tool with this week's ETo$/, 'استخدم أداة توازن الري مع قيمة ETo لهذا الأسبوع')
    .replace(/^Switch to water-only or low-K finish formula$/, 'انتقل إلى الماء فقط أو تركيبة إنهاء منخفضة البوتاسيوم')
    .replace(/^Protect crops with frost cloth, overhead irrigation, or move container plants indoors\.$/, 'احمِ المحاصيل بأغطية الصقيع أو الري العلوي، وانقل النباتات المزروعة في حاويات إلى الداخل.')
    .replace(/^Increase irrigation, use shade cloth \(30-50%\), avoid foliar sprays during peak heat\.$/, 'زد الري، واستخدم شبكة تظليل بنسبة 30–50%، وتجنب الرش الورقي أثناء ذروة الحرارة.')
    .replace(/^Delay fertilizer application\. Ensure drainage is clear\. Scout for disease 3-5 days after\.$/, 'أجّل تطبيق السماد، وتأكد من خلو المصارف، وافحص الأمراض بعد 3–5 أيام.');

  return { ...alert, title, message, action };
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { language } = useTranslation();

  // Form state
  const [lat, setLat] = useState('19.4326');
  const [lng, setLng] = useState('-99.1332');
  const [crop, setCrop] = useState('tomato');
  const [plantingDate, setPlantingDate] = useState(() => {
    // Default: 8 weeks ago
    const d = new Date();
    d.setDate(d.getDate() - 56);
    return d.toISOString().slice(0, 10);
  });

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          crop,
          plantingDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data: AlertsResponse = await res.json();
      setAlerts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not available in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
      },
      (err) => setError(err.message || 'Could not get location'),
    );
  };

  // Badge count for the bell icon
  const alertCount = alerts ? (alerts.summary.critical + alerts.summary.action) : 0;

  return (
    <>
      {/* Floating bell button — bottom-right (above AI Agronomist) */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        style={{ bottom: open ? 'auto' : '6rem' }}
        title={copyFor(language, 'Predictive alerts', 'Alertes prédictives', 'تنبيهات تنبؤية')}
      >
        <Bell className="h-5 w-5" />
        {alertCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {alertCount}
          </span>
        )}
      </button>

      {/* Alert panel */}
      {open && (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="fixed bottom-24 right-6 z-40 w-[min(440px,calc(100vw-3rem))] max-h-[70vh] flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 backdrop-blur">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">{copyFor(language, 'Predictive Alerts', 'Alertes prédictives', 'التنبيهات التنبؤية')}</div>
                <div className="text-[10px] text-amber-100/90 leading-tight">{copyFor(language, 'Weather + disease + phenology', 'Météo + maladies + phénologie', 'الطقس + الأمراض + الفينولوجيا')}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-amber-100 hover:text-white p-1 rounded hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <div className="p-3 border-b border-border space-y-2 bg-muted/20">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{copyFor(language, 'Latitude', 'Latitude', 'خط العرض')}</label>
                <Input value={lat} onChange={e => setLat(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{copyFor(language, 'Longitude', 'Longitude', 'خط الطول')}</label>
                <Input value={lng} onChange={e => setLng(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{copyFor(language, 'Crop', 'Culture', 'المحصول')}</label>
                <Input value={crop} onChange={e => setCrop(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{copyFor(language, 'Planting date', 'Date de plantation', 'تاريخ الزراعة')}</label>
                <Input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={useMyLocation} className="gap-1.5 text-xs h-8">
                <MapPin className="h-3 w-3" /> GPS
              </Button>
              <Button size="sm" onClick={fetchAlerts} disabled={loading} className="gap-1.5 text-xs h-8 flex-1">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {copyFor(language, 'Check alerts', 'Vérifier les alertes', 'تحقّق من التنبيهات')}
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded p-2 border border-destructive/30 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {copyFor(language, 'Fetching forecast + running disease models...', 'Récupération des prévisions et exécution des modèles de maladies…', 'جلب التوقعات + تشغيل نماذج الأمراض...')}
              </div>
            )}

            {!loading && !alerts && !error && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {copyFor(language, 'Enter your location and crop, then click "Check alerts" to get proactive warnings for the next 7 days.', 'Saisissez votre localisation et votre culture, puis cliquez sur « Vérifier les alertes » pour obtenir des avertissements préventifs pour les 7 prochains jours.', 'أدخل موقعك ومحصولك، ثم اضغط «تحقّق من التنبيهات» للحصول على تحذيرات استباقية للأيام الـ7 القادمة.')}
              </div>
            )}

            {alerts && !loading && (
              <>
                {/* Summary */}
                <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                  <Badge variant="outline" className="text-[10px]">
                    {copyFor(language, `Week ${alerts.currentWeek}/${alerts.totalWeeks}`, `Semaine ${alerts.currentWeek}/${alerts.totalWeeks}`, `أسبوع ${alerts.currentWeek}/${alerts.totalWeeks}`)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {language === 'ar' ? (STAGE_AR[alerts.currentStage] ?? alerts.currentStage) : alerts.currentStage}
                  </Badge>
                  <span className="text-muted-foreground ml-auto">{alerts.summary.total} {copyFor(language, 'alerts', 'alertes', 'تنبيهات')}</span>
                </div>

                {alerts.alerts.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{copyFor(language, 'No alerts — conditions look good for the next 7 days.', 'Aucune alerte — les conditions semblent bonnes pour les 7 prochains jours.', 'لا تنبيهات — تبدو الظروف جيدة للأيام الـ7 القادمة.')}</span>
                  </div>
                ) : (
                  alerts.alerts.map(rawAlert => {
                    const a = localizeAlert(rawAlert, language);
                    const style = PRIORITY_STYLES[a.priority];
                    const CatIcon = CATEGORY_ICONS[a.category];
                    return (
                      <div
                        key={a.id}
                        className="rounded-lg p-3 border"
                        style={{ background: style.bg, borderColor: style.border }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex items-center justify-center h-6 w-6 rounded flex-shrink-0" style={{ background: `${style.color}20` }}>
                            <CatIcon className="h-3.5 w-3.5" style={{ color: style.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold" style={{ color: style.color }}>{a.title}</span>
                              {a.forecastDays != null && a.forecastDays >= 0 && (
                                <span className="text-[9px] text-muted-foreground">{copyFor(language, `in ${a.forecastDays}d`, `dans ${a.forecastDays} j`, `خلال ${a.forecastDays}ي`)}</span>
                              )}
                            </div>
                            <p className="text-xs text-foreground mt-0.5 leading-snug">{a.message}</p>
                            {a.action && (
                              <div className="text-[11px] mt-1 p-1.5 rounded bg-white/50 dark:bg-black/20 italic" style={{ color: style.color }}>
                                → {a.action}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
