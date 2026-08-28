'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wind,
  CloudRain,
  Thermometer,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sun,
  Sparkles,
  Droplets,
  Share2,
  Copy,
  Check,
  Clock,
  Send,
  Sliders,
} from 'lucide-react';
import type { ForecastResult } from '@/lib/open-meteo';
import { useTranslation, copyFor } from '@/lib/language-store';
import { ToolExplainerDialog } from '@/components/agri/ToolExplainerDialog';

interface FarmerWeatherAdvisorProps {
  forecast: ForecastResult | null;
  cropName?: string;
  stageName?: string;
  netIrrigationMm?: number;
  sunMode?: boolean;
}

interface SprayTimeSlot {
  timeEn: string;
  timeAr: string;
  timeFr: string;
  status: 'optimal' | 'caution' | 'forbidden';
  temp: number;
  windKmH: number;
  humidityPct: number;
  deltaT: number;
  labelEn: string;
  labelAr: string;
  labelFr: string;
}

export function FarmerWeatherAdvisor({
  forecast,
  cropName = 'Potato',
  stageName = 'Vegetative Growth',
  netIrrigationMm = 3.5,
  sunMode = false,
}: FarmerWeatherAdvisorProps) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showHourlyWindows, setShowHourlyWindows] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  const current = forecast?.current;
  const today = forecast?.daily[0];
  const windSpeed = current?.windSpeed10m ?? 8;
  const rainSum = today?.precipitationSum ?? 0;
  const temp = current?.temperature ?? 22;
  const maxTemp = today?.tempMax ?? 28;
  const minTemp = today?.tempMin ?? 12;

  // 1. Spray Go / No-Go Decision Logic
  let sprayStatus: 'good' | 'caution' | 'bad' = 'good';
  let sprayReasonEn = 'Calm wind (< 12 km/h) & no heavy rain: Optimal spray window.';
  let sprayReasonFr = 'Vent faible (< 12 km/h) et sans pluie : Conditions idéales pour traiter.';
  let sprayReasonAr = 'رياح هادئة (< 12 كم/سا) وبدون أمطار: توقيت ممتاز للرش والمعالجة.';

  if (windSpeed > 20) {
    sprayStatus = 'bad';
    sprayReasonEn = `High wind (${windSpeed.toFixed(0)} km/h): High drift risk. Do not spray today.`;
    sprayReasonFr = `Vent fort (${windSpeed.toFixed(0)} km/h) : Risque de dérive élevé. Ne pas traiter.`;
    sprayReasonAr = `رياح قوية (${windSpeed.toFixed(0)} كم/سا): خطر تطاير المبيد. لا تقم بالرش اليوم.`;
  } else if (windSpeed >= 12 || rainSum > 4) {
    sprayStatus = 'caution';
    sprayReasonEn = `Moderate wind (${windSpeed.toFixed(0)} km/h) or rain risk. Spray early morning with low boom.`;
    sprayReasonFr = `Vent modéré (${windSpeed.toFixed(0)} km/h) ou risque de pluie. Traiter tôt le matin.`;
    sprayReasonAr = `رياح معتدلة (${windSpeed.toFixed(0)} كم/سا) أو احتمال مطر. رش في الصباح الباكر وبضغط منخفض.`;
  }

  // 2. Field Heat & Thermal Status
  let heatStatus: 'normal' | 'hot' | 'frost' = 'normal';
  if (maxTemp >= 34) {
    heatStatus = 'hot';
  } else if (minTemp <= 3) {
    heatStatus = 'frost';
  }

  // 3. Recommended Irrigation runtime (assuming standard drip flow 2.0 L/h)
  const approxIrrigationHours = (netIrrigationMm / 2.0).toFixed(1);

  // 4. Simulated Hourly Spray Windows based on current daily pattern
  const hourlySlots: SprayTimeSlot[] = [
    {
      timeEn: '06:00 - 09:00 AM',
      timeAr: '06:00 - 09:00 صباحاً',
      timeFr: '06h00 - 09h00',
      status: windSpeed < 14 && rainSum < 2 ? 'optimal' : 'caution',
      temp: Math.round(minTemp + (maxTemp - minTemp) * 0.25),
      windKmH: Math.max(4, Math.round(windSpeed * 0.65)),
      humidityPct: 78,
      deltaT: 3.2,
      labelEn: 'Optimal Window: High absorption, minimal drift, safe leaf temp.',
      labelAr: 'فترة ذهبية: امتصاص ممتاز، تطاير منعدم، حرارة ورقة آمنة.',
      labelFr: 'Créneau idéal : Absorption maximale, dérive nulle, feuille fraîche.',
    },
    {
      timeEn: '09:00 - 12:00 PM',
      timeAr: '09:00 - 12:00 ظهراً',
      timeFr: '09h00 - 12h00',
      status: maxTemp > 30 || windSpeed > 15 ? 'caution' : 'optimal',
      temp: Math.round(minTemp + (maxTemp - minTemp) * 0.7),
      windKmH: Math.round(windSpeed * 0.9),
      humidityPct: 55,
      deltaT: 5.8,
      labelEn: 'Moderate: Watch rising wind & droplet evaporation.',
      labelAr: 'مقبول بحذر: انتبه لتصاعد الرياح وسرعة تبخر القطرات.',
      labelFr: 'Acceptable : Surveillez la montée du vent et l’évaporation.',
    },
    {
      timeEn: '12:00 - 16:00 PM',
      timeAr: '12:00 - 16:00 بعد الظهر',
      timeFr: '12h00 - 16h00',
      status: 'forbidden',
      temp: Math.round(maxTemp),
      windKmH: Math.round(windSpeed * 1.2),
      humidityPct: 35,
      deltaT: 9.5,
      labelEn: 'Forbidden: High heat scorch & rapid droplet evaporation (Delta T > 8).',
      labelAr: 'ممنوع تماماً: خطر حرق الأوراق وتبخر القطرات فورياً (Delta T > 8).',
      labelFr: 'Interdit : Risque de brûlure foliaire et évaporation éclair.',
    },
    {
      timeEn: '17:00 - 20:00 PM',
      timeAr: '17:00 - 20:00 مساءً',
      timeFr: '17h00 - 20h00',
      status: windSpeed < 16 ? 'optimal' : 'caution',
      temp: Math.round(minTemp + (maxTemp - minTemp) * 0.5),
      windKmH: Math.max(5, Math.round(windSpeed * 0.75)),
      humidityPct: 68,
      deltaT: 4.1,
      labelEn: 'Evening Window: Good for systemic fungicides and foliar feeds.',
      labelAr: 'فترة المساء: ممتازة للمبيدات الجهازية والأسمدة الورقية.',
      labelFr: 'Créneau du soir : Idéal pour fongicides systémiques et foliaires.',
    },
  ];

  // Spoken Text-to-Speech briefing
  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    let speechText = '';
    let voiceLang = 'fr-FR';

    if (language === 'ar') {
      voiceLang = 'ar-SA';
      const sprayBrief = sprayStatus === 'good'
        ? 'الرياح هادئة والظروف ممتازة للرش والمعالجة.'
        : sprayStatus === 'caution'
        ? 'انتبه: الرياح معتدلة، يُفضل الرش في الصباح الباكر فقط.'
        : 'تحذير: الرياح قوية، يُمنع الرش اليوم لتجنب تطاير المبيد.';

      const irrBrief = netIrrigationMm > 1
        ? `حاجة السقي اليوم هي ${netIrrigationMm.toFixed(1)} ملمتر، أي حوالي ${approxIrrigationHours} ساعات سقي.`
        : 'المطر يغطي حاجة النبات ولا داعي للسقي اليوم.';

      speechText = `السلام عليكم يا عمي الفلاح. حالة الطقس في مزرعتك اليوم: درجة الحرارة ${temp.toFixed(0)} درجة، وسرعة الرياح ${windSpeed.toFixed(0)} كيلومتر في الساعة. ${sprayBrief} ${irrBrief} محصول ${cropName} في مرحلة ${stageName}. بالتوفيق وبركة في عملك اليوم.`;
    } else if (language === 'fr') {
      voiceLang = 'fr-FR';
      const sprayBrief = sprayStatus === 'good'
        ? 'Vent calme, conditions idéales pour pulvériser.'
        : sprayStatus === 'caution'
        ? 'Vent modéré, traitez uniquement tôt le matin.'
        : 'Vent fort, ne pas pulvériser aujourd\'hui.';

      const irrBrief = netIrrigationMm > 1
        ? `Besoin en irrigation de ${netIrrigationMm.toFixed(1)} millimètres, soit environ ${approxIrrigationHours} heures d'arrosage.`
        : 'La pluie couvre les besoins, pas d\'arrosage nécessaire.';

      speechText = `Bonjour. Bulletin météo pour votre parcelle : Température de ${temp.toFixed(0)} degrés, vent à ${windSpeed.toFixed(0)} km/h. ${sprayBrief} ${irrBrief} Votre culture de ${cropName} est en ${stageName}. Bon travail sur le terrain.`;
    } else {
      voiceLang = 'en-US';
      speechText = `Hello. Daily farm briefing: Temperature is ${temp.toFixed(0)}°C, wind speed is ${windSpeed.toFixed(0)} km/h. ${sprayReasonEn} Irrigation demand is ${netIrrigationMm.toFixed(1)} mm (~${approxIrrigationHours} hours). Have a productive day on the farm.`;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // WhatsApp / Dispatch Card Generator
  const shareText = language === 'ar'
    ? `🌿 *قرار الحقل اليومي - أطلس الفلاحة* 🌿
📍 المحصول: ${cropName} (${stageName})
📅 التاريخ: ${new Date().toLocaleDateString('ar-DZ')}
---------------------------------
🚦 *حالة الرش والمبيدات:* ${sprayStatus === 'good' ? '✅ مناسب جداً للرش' : sprayStatus === 'caution' ? '⚠️ رش بحذر بالصباح الباكر' : '❌ ممنوع الرش (رياح قوية)'}
💨 سرعة الرياح: ${windSpeed.toFixed(0)} كم/سا
🌡️ الحرارة: ${temp.toFixed(0)}°C (العظمى: ${maxTemp.toFixed(0)}°C)
💧 *احتياج السقي:* ${netIrrigationMm.toFixed(1)} ملم (~${approxIrrigationHours} ساعات سقي)
${heatStatus === 'hot' ? '🔥 تنبيه: موجة حر (الشهيلي) - اسقِ ليلاً!' : ''}
${heatStatus === 'frost' ? '❄️ تنبيه: خطر صقيع - جهز الري الوقائي!' : ''}`
    : `🌿 *Daily Field Decision - Formula Atlas* 🌿
📍 Crop: ${cropName} (${stageName})
📅 Date: ${new Date().toLocaleDateString()}
---------------------------------
🚦 *Spraying Window:* ${sprayStatus === 'good' ? '✅ Optimal' : sprayStatus === 'caution' ? '⚠️ Caution (Early morning)' : '❌ No Spray (High wind)'}
💨 Wind: ${windSpeed.toFixed(0)} km/h | 🌡️ Temp: ${temp.toFixed(0)}°C (Max: ${maxTemp.toFixed(0)}°C)
💧 *Irrigation Need:* ${netIrrigationMm.toFixed(1)} mm (~${approxIrrigationHours} hrs drip runtime)
${heatStatus === 'hot' ? '🔥 Heatwave Alert: Irrigate at night!' : ''}
${heatStatus === 'frost' ? '❄️ Frost Alert: Prepare protection!' : ''}`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className={`overflow-hidden border-2 ${
      sprayStatus === 'good'
        ? 'border-emerald-500/80 bg-gradient-to-br from-emerald-50/70 via-background to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20'
        : sprayStatus === 'caution'
        ? 'border-amber-500/80 bg-gradient-to-br from-amber-50/70 via-background to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20'
        : 'border-rose-500/80 bg-gradient-to-br from-rose-50/70 via-background to-red-50/40 dark:from-rose-950/30 dark:to-red-950/20'
    } ${sunMode ? 'border-foreground bg-background text-foreground' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header with Spoken Audio Guidance & WhatsApp Share Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sun className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {tr('Field Conditions & Morning Go/No-Go Advisory', 'جاهزية الحقل وقرار الرش والسقي الصباحي', 'Avis météo & Décision matinale')}
              </h3>
              <div className="text-sm font-extrabold text-foreground">
                {temp.toFixed(1)}°C · {windSpeed.toFixed(0)} km/h {tr('Wind', 'رياح', 'Vent')} · {rainSum.toFixed(1)} mm {tr('Rain', 'مطر', 'Pluie')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {speechSupported && (
              <Button
                type="button"
                variant={isPlayingAudio ? 'destructive' : 'default'}
                size="sm"
                onClick={handleToggleAudio}
                className={`h-8 px-2.5 gap-1.5 font-bold text-xs shadow-sm transition-all ${
                  isPlayingAudio ? 'animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>{tr('Stop', 'إيقاف', 'Arrêter')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{tr('🎙️ Audio Brief', '🎙️ ملخص صوتي', '🎙️ Audio')}</span>
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 px-2.5 gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
              title={tr('Send decision brief via WhatsApp', 'إرسال الملخص عبر واتساب', 'Partager sur WhatsApp')}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            <ToolExplainerDialog category="spray_weather_deltat" triggerVariant="outline" className="h-8 text-xs" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyShare}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              title={tr('Copy text to clipboard', 'نسخ النص', 'Copier le texte')}
            >
              {copiedShare ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Advisory Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* 1. Spray Decision */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            sprayStatus === 'good'
              ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
              : sprayStatus === 'caution'
              ? 'bg-amber-100/60 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
              : 'bg-rose-100/60 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800'
          }`}>
            {sprayStatus === 'good' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : sprayStatus === 'caution' ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold">
                {sprayStatus === 'good'
                  ? tr('✅ GO: Optimal Spray Window', '✅ مسموح: الظروف مثالية للرش', '✅ GO : Conditions idéales pour pulvériser')
                  : sprayStatus === 'caution'
                  ? tr('⚠️ CAUTION: Moderate Wind', '⚠️ انتباه: رياح معتدلة', '⚠️ ATTENTION : Vent modéré')
                  : tr('⛔ NO-GO: Do Not Spray Today', '⛔ ممنوع: لا تقم بالرش اليوم', '⛔ NO-GO : Ne pas traiter aujourd\'aujourd\'hui')}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {language === 'ar' ? sprayReasonAr : language === 'fr' ? sprayReasonFr : sprayReasonEn}
              </p>
            </div>
          </div>

          {/* 2. Irrigation & Heat Advice */}
          <div className="p-3 rounded-xl border border-border bg-card/90 flex items-start gap-2.5">
            <Droplets className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-foreground">
                {netIrrigationMm > 1
                  ? tr(`💧 Water Demand: ${netIrrigationMm.toFixed(1)} mm (~${approxIrrigationHours}h)`, `💧 احتياج السقي: ${netIrrigationMm.toFixed(1)} ملم (~${approxIrrigationHours} ساعات)`, `💧 Besoin en eau : ${netIrrigationMm.toFixed(1)} mm (~${approxIrrigationHours}h)`)
                  : tr('💧 Soil Sufficient (Rain covers need)', '💧 رطوبة كافية (المطر يغطي الحاجة)', '💧 Sol humide (Pluie suffisante)')}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {heatStatus === 'hot'
                  ? tr('High daytime heat (>34°C): Irrigate strictly before 08:00 AM or after sunset.', 'حرارة مرتفعة (>34°م): اسقِ حصراً قبل 8 صباحاً أو بعد الغروب.', 'Forte chaleur (>34°C) : Arrosez impérativement avant 8h ou au crépuscule.')
                  : heatStatus === 'frost'
                  ? tr('Frost risk at night: Ensure soil is moist to buffer root temperature.', 'خطر صقيع ليلي: حافظ على رطوبة التربة لحماية الجذور من التجمد.', 'Risque de gelée blanche : Gardez le sol humide pour protéger les racines.')
                  : tr('Standard transpiration. Maintain consistent drip moisture.', 'معدل نتح معتدل. حافظ على انتظام رطوبة شبكة التقطير.', 'Transpiration modérée. Maintenez une humidité régulière.')}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Hourly Spray Windows Bar */}
        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHourlyWindows((prev) => !prev)}
            className="w-full text-xs text-muted-foreground hover:text-foreground h-8 justify-between px-3 border border-border/60 bg-muted/20 rounded-lg"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              {tr('View Hourly Spray Windows & Delta T Chart', 'عرض جدول الساعات الأنسب للرش ومؤشر دلتا T', 'Voir les créneaux horaires de pulvérisation & Delta T')}
            </span>
            <span className="text-[11px] font-bold text-emerald-600">
              {showHourlyWindows ? tr('Hide', 'إخفاء', 'Masquer') : tr('Show Hours', 'عرض الساعات', 'Détails')}
            </span>
          </Button>

          {showHourlyWindows && (
            <div className="mt-2.5 space-y-2 border border-border/80 rounded-xl p-3 bg-card animate-in fade-in">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {tr('Daily Spray Window Breakdown (Delta T, Wind & Leaf Safety):', 'تفصيل فترات الرش اليومية (دلتا T، الرياح وسلامة الأوراق):', 'Créneaux horaires de traitement (Delta T, vent et sécurité) :')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hourlySlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                      slot.status === 'optimal'
                        ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                        : slot.status === 'caution'
                        ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200'
                        : 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{language === 'ar' ? slot.timeAr : language === 'fr' ? slot.timeFr : slot.timeEn}</span>
                      <Badge
                        className={`text-[10px] py-0 px-1.5 ${
                          slot.status === 'optimal' ? 'bg-emerald-600 text-white' : slot.status === 'caution' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {slot.status === 'optimal' ? tr('Optimal', 'ممتاز', 'Optimal') : slot.status === 'caution' ? tr('Caution', 'حذر', 'Attention') : tr('Forbidden', 'ممنوع', 'Interdit')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      <span>🌡️ {slot.temp}°C</span>
                      <span>💨 {slot.windKmH} km/h</span>
                      <span>💧 {slot.humidityPct}% RH</span>
                      <span>ΔT: {slot.deltaT}°C</span>
                    </div>
                    <p className="text-[10px] leading-tight pt-0.5">
                      {language === 'ar' ? slot.labelAr : language === 'fr' ? slot.labelFr : slot.labelEn}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>
                  {tr(
                    'Delta T rule: Keep Delta T between 2°C and 8°C. Above 8°C, fine droplets evaporate in mid-air before reaching pests.',
                    'قاعدة دلتا T: حافظ على دلتا T بين 2 و 8 درجات. فوق 8 درجات، تتبخر القطرات في الهواء قبل ملامسة النبات.',
                    'Règle Delta T: Traitez entre 2°C et 8°C de Delta T. Au-delà de 8°C, les gouttelettes s’évaporent en vol.'
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
