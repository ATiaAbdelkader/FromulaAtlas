'use client';

/**
 * WhatsApp Daily Brief — generates a one-tap daily farm brief message and
 * lets the farmer send it via WhatsApp, copy it to the clipboard, or
 * schedule a daily reminder.
 *
 * The brief reads:
 *   1. Farm profile (useFarmProfile hook) — crop, planting date, area, location
 *   2. Live 7-day forecast (Open-Meteo) — temp, rain, ET₀
 *   3. Today's tasks (FarmPilot.generateTodayTasks)
 *   4. Today's irrigation (FarmPilot.calculateIrrigation)
 *
 * The message is built in the user's selected UI language (EN / FR / AR)
 * and includes:
 *   - Greeting (Good morning / afternoon / evening)
 *   - Farm name + crop + active stage
 *   - Today's weather (max/min temp, rain mm, ET₀)
 *   - Today's irrigation recommendation (m³ + duration)
 *   - Today's fertilizer recommendation (if applicable)
 *   - Top 3 tasks for today
 *   - Weather alerts (frost / heat / wind) if any
 *
 * Author: Formula Atlas — feature #7
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { MessageCircle, Copy, Check, CalendarClock, RefreshCw, Bell } from 'lucide-react';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { useFarmProfile, type FarmProfile } from '@/components/agri/farm-profile-wizard';
import { getForecast, type ForecastResult, type DailyForecast } from '@/lib/open-meteo';
import {
  getCropById,
  getActiveStage,
  calculateIrrigation,
  generateTodayTasks,
  type IrrigationResult,
  type TodayTask,
  type StageProgress,
} from '@/lib/farmpilot-engine';
import {
  CROP_STAGE_LABELS,
  type FarmPilotPlan,
  type FarmPilotCrop,
  FARMPILOT_PLAN_KEY,
} from '@/lib/farmpilot-data';
import { ALL_58_WILAYAS } from '@/lib/algeria-wilayas-58';
import { localizedWeatherLabel } from '@/lib/weather-localization';
import { useTranslation, type Language } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  setDailyBriefSchedule,
  getDailyBriefSchedule,
} from '@/lib/notification-scheduler';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherAlert {
  kind: 'frost' | 'heat' | 'wind';
  day: DailyForecast;
}

export interface BriefContext {
  profile: FarmProfile;
  crop: FarmPilotCrop;
  plan: FarmPilotPlan;
  activeStage: StageProgress | undefined;
  forecast: ForecastResult | null;
  today: DailyForecast | undefined;
  irrigation: IrrigationResult | null;
  tasks: TodayTask[];
  alerts: WeatherAlert[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Trilingual UI copy
// ---------------------------------------------------------------------------

const COPY = {
  title: {
    en: 'WhatsApp Daily Brief',
    fr: 'Brief Quotidien WhatsApp',
    ar: 'ملخّص واتساب اليومي',
  } as TrilingualString,
  description: {
    en: 'Generate a one-tap daily farm brief: weather, irrigation, fertilizer, top tasks, and alerts — then send via WhatsApp.',
    fr: 'Générez en un clic un brief quotidien de votre ferme : météo, irrigation, fertilisation, priorités et alertes — puis envoyez-le sur WhatsApp.',
    ar: 'أنشئ ملخّصاً يومياً للمزرعة بنقرة واحدة: الطقس والري والتسميد وأهم المهام والتنبيهات — ثم أرسله عبر واتساب.',
  } as TrilingualString,
  noProfile: {
    en: 'Set up your farm profile first (farm name, crop, planting date) to generate a daily brief.',
    fr: 'Configurez d\u2019abord votre profil de ferme (nom, culture, date de plantation) pour générer le brief quotidien.',
    ar: 'أولاً أعدّ ملف المزرعة (الاسم، المحصول، تاريخ الزراعة) لإنشاء الملخّص اليومي.',
  } as TrilingualString,
  noCrop: {
    en: 'Your farm profile does not include a supported crop. Edit your farm profile to pick one.',
    fr: 'Votre profil de ferme ne contient pas de culture prise en charge. Modifiez le profil pour en choisir une.',
    ar: 'ملف مزرعتك لا يحتوي على محصول مدعوم. عدّل الملف لاختيار محصول.',
  } as TrilingualString,
  generate: {
    en: 'Generate Brief',
    fr: 'Générer le brief',
    ar: 'إنشاء الملخّص',
  } as TrilingualString,
  sendWhatsapp: {
    en: 'Send via WhatsApp',
    fr: 'Envoyer via WhatsApp',
    ar: 'أرسل عبر واتساب',
  } as TrilingualString,
  copy: {
    en: 'Copy Brief',
    fr: 'Copier le brief',
    ar: 'نسخ الملخّص',
  } as TrilingualString,
  scheduleDaily: {
    en: 'Schedule Daily',
    fr: 'Planifier chaque jour',
    ar: 'جدولة يومية',
  } as TrilingualString,
  scheduled: {
    en: 'Daily schedule saved',
    fr: 'Planification quotidienne enregistrée',
    ar: 'تم حفظ الجدولة اليومية',
  } as TrilingualString,
  preview: {
    en: 'WhatsApp Message Preview',
    fr: 'Aperçu du message WhatsApp',
    ar: 'معاينة رسالة واتساب',
  } as TrilingualString,
  loading: {
    en: 'Loading forecast…',
    fr: 'Chargement des prévisions…',
    ar: 'جارٍ تحميل التوقعات…',
  } as TrilingualString,
  refresh: {
    en: 'Refresh',
    fr: 'Rafraîchir',
    ar: 'تحديث',
  } as TrilingualString,
  copiedToast: {
    en: 'Brief copied to clipboard',
    fr: 'Brief copié dans le presse-papiers',
    ar: 'تم نسخ الملخّص',
  } as TrilingualString,
  scheduledToast: {
    en: 'Daily brief scheduled at 06:00 — open the app to view it.',
    fr: 'Brief quotidien planifié à 06:00 — ouvrez l\u2019application pour le consulter.',
    ar: 'تمت جدولة الملخّص اليومي عند 06:00 — افتح التطبيق لعرضه.',
  } as TrilingualString,
  forecastError: {
    en: 'Weather forecast unavailable — using fallback ET₀ values.',
    fr: 'Prévisions météo indisponibles — utilisation de valeurs ET₀ par défaut.',
    ar: 'توقعات الطقس غير متاحة — استخدام قيم ET₀ افتراضية.',
  } as TrilingualString,
};

// ---------------------------------------------------------------------------
// Helpers
// (Exported so they can be unit-tested by scripts/test-whatsapp-brief.ts —
//  the React component itself is too heavy for unit testing, but the
//  message-building logic is pure and easy to lock.)
// ---------------------------------------------------------------------------

/** Pick a trilingual string by language. */
export function pick<T extends { en: string; fr: string; ar: string }>(
  lang: Language,
  obj: T,
): string {
  return obj[lang];
}

/** Time-of-day greeting in the requested language. */
export function timeGreeting(lang: Language, date: Date = new Date()): string {
  const h = date.getHours();
  let en = 'Good evening';
  let fr = 'Bonsoir';
  let ar = 'مساء الخير';
  if (h < 12) {
    en = 'Good morning';
    fr = 'Bonjour';
    ar = 'صباح الخير';
  } else if (h < 17) {
    en = 'Good afternoon';
    fr = 'Bon après-midi';
    ar = 'نهارك سعيد';
  }
  if (lang === 'ar') return ar;
  if (lang === 'fr') return fr;
  return en;
}

export function findWilaya(profile: FarmProfile) {
  if (profile.lat && profile.lng) {
    const lat = parseFloat(profile.lat);
    const lng = parseFloat(profile.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      let closest = ALL_58_WILAYAS[0];
      let best = Number.POSITIVE_INFINITY;
      for (const w of ALL_58_WILAYAS) {
        const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2;
        if (d < best) {
          best = d;
          closest = w;
        }
      }
      return closest;
    }
  }
  return undefined;
}

export function wilayaName(lang: Language, w: ReturnType<typeof findWilaya>): string {
  if (!w) return '';
  if (lang === 'ar') return w.nameAr;
  if (lang === 'fr') return w.nameFr;
  return w.nameEn;
}

/** Read the FarmPilot plan from localStorage, falling back to sensible defaults. */
function readPlan(profile: FarmProfile, crop: FarmPilotCrop): FarmPilotPlan {
  const fallback: FarmPilotPlan = {
    cropId: crop.id,
    plantingDate: profile.plantingDate ?? new Date().toISOString().slice(0, 10),
    areaHa: profile.area ?? 0.5,
    productionSystem: 'open_field',
    irrigationSystem: 'drip',
    irrigationFlowLph: 2000,
    fertilizerProduct: '15-15-15',
    targetYieldTonsHa: crop.referenceYieldTonsHa,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(FARMPILOT_PLAN_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<FarmPilotPlan>;
    return {
      ...fallback,
      ...parsed,
      cropId: crop.id,
      plantingDate: parsed.plantingDate ?? fallback.plantingDate,
      areaHa: typeof parsed.areaHa === 'number' ? parsed.areaHa : fallback.areaHa,
    };
  } catch {
    return fallback;
  }
}

export function detectAlerts(
  daily: DailyForecast[] | undefined,
): WeatherAlert[] {
  if (!daily || daily.length === 0) return [];
  const alerts: WeatherAlert[] = [];
  for (const day of daily.slice(0, 3)) {
    if (day.tempMin < 2) alerts.push({ kind: 'frost', day });
    if (day.tempMax >= 38) alerts.push({ kind: 'heat', day });
    if (day.windSpeedMax >= 50) alerts.push({ kind: 'wind', day });
  }
  return alerts;
}

export function alertLabel(lang: Language, alert: WeatherAlert): string {
  const dateStr = new Date(`${alert.day.date}T00:00`).toLocaleDateString(
    lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-DZ',
    { weekday: 'short', month: 'short', day: 'numeric' },
  );
  if (alert.kind === 'frost') {
    return {
      en: `❄️ FROST ALERT on ${dateStr}: min ${alert.day.tempMin.toFixed(1)}°C — protect sensitive crops tonight.`,
      fr: `❄️ ALERTE GEL le ${dateStr}: min ${alert.day.tempMin.toFixed(1)}°C — protégez les cultures sensibles cette nuit.`,
      ar: `❄️ تحذير صقيع في ${dateStr}: الصغرى ${alert.day.tempMin.toFixed(1)}°م — احمِ المحاصيل الحساسة الليلة.`,
    }[lang];
  }
  if (alert.kind === 'heat') {
    return {
      en: `🔥 HEAT ALERT on ${dateStr}: max ${alert.day.tempMax.toFixed(1)}°C — irrigate early morning, add mulch.`,
      fr: `🔥 ALERTE CHALEUR le ${dateStr}: max ${alert.day.tempMax.toFixed(1)}°C — irriguez tôt le matin, ajoutez du paillis.`,
      ar: `🔥 تحذير حر في ${dateStr}: الكبرى ${alert.day.tempMax.toFixed(1)}°م — اسقِ صباحاً مبكراً وأضف نشارة.`,
    }[lang];
  }
  // wind
  return {
    en: `💨 WIND ALERT on ${dateStr}: gusts up to ${alert.day.windSpeedMax.toFixed(0)} km/h — delay spraying.`,
    fr: `💨 ALERTE VENT le ${dateStr}: rafales jusqu'à ${alert.day.windSpeedMax.toFixed(0)} km/h — reportez les traitements.`,
    ar: `💨 تحذير رياح في ${dateStr}: هبّات حتى ${alert.day.windSpeedMax.toFixed(0)} كم/س — أجّل الرش.`,
  }[lang];
}

// ---------------------------------------------------------------------------
// Message builder
// ---------------------------------------------------------------------------

export function buildBriefMessage(ctx: BriefContext, lang: Language): string {
  const lines: string[] = [];
  const { profile, crop, plan, activeStage, today, irrigation, tasks, alerts } = ctx;
  const farmName = profile.name?.trim() || {
    en: 'My Farm',
    fr: 'Ma Ferme',
    ar: 'مزرعتي',
  }[lang];

  // 1. Greeting + farm name + crop + stage
  lines.push(`${timeGreeting(lang)} 👋 — *${farmName}*`);
  const cropName = crop.name[lang];
  const stage = activeStage
    ? `${CROP_STAGE_LABELS[activeStage.stage].emoji} ${CROP_STAGE_LABELS[activeStage.stage].label[lang]}`
    : '—';
  const areaStr = plan.areaHa ? `${plan.areaHa} ha` : '—';
  const wilaya = findWilaya(profile);
  const locStr = wilaya ? wilayaName(lang, wilaya) : profile.lat && profile.lng ? `${profile.lat}, ${profile.lng}` : '';
  lines.push(`🌱 ${cropName} · ${stage} · ${areaStr}${locStr ? ` · ${locStr}` : ''}`);
  lines.push(`📅 ${new Date().toLocaleDateString(
    lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-DZ',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  )}`);
  lines.push('');

  // 2. Today's weather
  lines.push(pick(lang, {
    en: '🌤 *Today\u2019s Weather*',
    fr: '🌤 *Météo du jour*',
    ar: '🌤 *طقس اليوم*',
  }));
  if (today) {
    const desc = localizedWeatherLabel(today.weatherCode, lang);
    lines.push(`• ${desc}`);
    lines.push(`• 🌡 ${today.tempMin.toFixed(1)}°C → ${today.tempMax.toFixed(1)}°C`);
    lines.push(`• 🌧 ${today.precipitationSum.toFixed(1)} mm (${today.precipitationProbability}% chance)`);
    lines.push(`• ☀️ ET₀: ${today.et0.toFixed(1)} mm/day`);
  } else {
    lines.push(pick(lang, {
      en: '• Weather data unavailable',
      fr: '• Données météo indisponibles',
      ar: '• بيانات الطقس غير متاحة',
    }));
  }
  lines.push('');

  // 3. Irrigation recommendation
  lines.push(pick(lang, {
    en: '💧 *Irrigation Today*',
    fr: '💧 *Irrigation du jour*',
    ar: '💧 *ري اليوم*',
  }));
  if (irrigation) {
    const vol = `${irrigation.totalM3PerDay} m³ (${irrigation.totalLitersPerDay.toLocaleString()} L)`;
    const dur = irrigation.irrigationDurationMinutes
      ? pick(lang, {
          en: ` · ${irrigation.irrigationDurationMinutes} min`,
          fr: ` · ${irrigation.irrigationDurationMinutes} min`,
          ar: ` · ${irrigation.irrigationDurationMinutes} دقيقة`,
        })
      : '';
    lines.push(`• ${vol}${dur}`);
    if (irrigation.effectiveRainfallMm > 0) {
      lines.push(pick(lang, {
        en: `• Effective rainfall: ${irrigation.effectiveRainfallMm.toFixed(1)} mm deducted`,
        fr: `• Pluie efficace: ${irrigation.effectiveRainfallMm.toFixed(1)} mm déduite`,
        ar: `• هطول فعال: ${irrigation.effectiveRainfallMm.toFixed(1)} ملم مخصوم`,
      }));
    }
    lines.push(`• Kc=${irrigation.kc.toFixed(2)} · ETc=${irrigation.etcMmPerDay.toFixed(2)} mm/day · efficiency ${(irrigation.irrigationEfficiency * 100).toFixed(0)}%`);
  } else {
    lines.push(pick(lang, {
      en: '• No irrigation recommendation (planting or harvest stage).',
      fr: '• Pas de recommandation d\u2019irrigation (stade semis ou récolte).',
      ar: '• لا توصية بالري (مرحلة الزراعة أو الحصاد).',
    }));
  }
  lines.push('');

  // 4. Fertilizer recommendation (if applicable)
  const fertTask = tasks.find((t) => t.id === 'today_fertilization');
  if (fertTask) {
    lines.push(pick(lang, {
      en: '🧪 *Fertilizer Today*',
      fr: '🧪 *Fertilisation du jour*',
      ar: '🧪 *تسميد اليوم*',
    }));
    lines.push(`• ${fertTask.title[lang]}`);
    lines.push(`• ${fertTask.detail[lang]}`);
    lines.push('');
  }

  // 5. Top 3 tasks
  lines.push(pick(lang, {
    en: '✅ *Top Tasks Today*',
    fr: '✅ *Priorités du jour*',
    ar: '✅ *أهم مهام اليوم*',
  }));
  const top3 = tasks.slice(0, 3);
  if (top3.length === 0) {
    lines.push(pick(lang, {
      en: '• No specific tasks — walk the field and observe.',
      fr: '• Pas de tâche spécifique — parcourez la parcelle et observez.',
      ar: '• لا مهام محددة — تجوّل في الحقل وراقب.',
    }));
  } else {
    top3.forEach((t, i) => {
      lines.push(`${i + 1}. ${t.emoji} ${t.title[lang]}`);
    });
  }
  lines.push('');

  // 6. Weather alerts (if any)
  if (alerts.length > 0) {
    lines.push(pick(lang, {
      en: '⚠️ *Weather Alerts*',
      fr: '⚠️ *Alertes météo*',
      ar: '⚠️ *تنبيهات الطقس*',
    }));
    alerts.forEach((a) => lines.push(alertLabel(lang, a)));
    lines.push('');
  }

  // Footer
  lines.push(pick(lang, {
    en: '— Sent from Formula Atlas 🌾',
    fr: '— Envoyé depuis Formula Atlas 🌾',
    ar: '— مرسل من أطلس المعادلات 🌾',
  }));

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WhatsappDailyBrief() {
  const { language } = useTranslation();
  const profile = useFarmProfile();
  const [brief, setBrief] = useState<string>('');
  const [ctx, setCtx] = useState<BriefContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reflect the persisted "schedule daily" toggle on mount.
  useEffect(() => {
    setScheduled(getDailyBriefSchedule().enabled);
  }, []);

  // Build the brief whenever the profile or refreshKey changes.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!profile?.setupCompleted || !profile.crop) {
        setBrief('');
        setCtx(null);
        return;
      }
      const crop = getCropById(profile.crop);
      if (!crop) {
        setBrief('');
        setCtx(null);
        return;
      }
      setLoading(true);
      const plan = readPlan(profile, crop);
      const activeStage = getActiveStage(crop, plan.plantingDate);

      // Wilaya + forecast
      const wilaya = findWilaya(profile);
      const lat = profile.lat ? parseFloat(profile.lat) : wilaya?.lat;
      const lng = profile.lng ? parseFloat(profile.lng) : wilaya?.lng;
      const fallbackEto = wilaya?.et0 ?? 5.0;

      let forecast: ForecastResult | null = null;
      let forecastError: string | undefined;
      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        try {
          forecast = await getForecast(lat, lng, { days: 4 });
        } catch (err) {
          forecastError = err instanceof Error ? err.message : String(err);
        }
      }

      if (cancelled) return;

      const today = forecast?.daily?.[0];
      const eto = today?.et0 ?? fallbackEto;
      const rainfall = today?.precipitationSum ?? 0;

      let irrigation: IrrigationResult | null = null;
      if (activeStage && activeStage.stage !== 'planting' && activeStage.stage !== 'harvest') {
        irrigation = calculateIrrigation(crop, activeStage.stage, plan, eto, rainfall);
      }

      const tasks = generateTodayTasks(crop, plan, activeStage, eto);
      const alerts = detectAlerts(forecast?.daily);

      const newCtx: BriefContext = {
        profile,
        crop,
        plan,
        activeStage,
        forecast,
        today,
        irrigation,
        tasks,
        alerts,
        error: forecastError,
      };

      const message = buildBriefMessage(newCtx, language);
      if (cancelled) return;
      setCtx(newCtx);
      setBrief(message);
      setLoading(false);
    }
    run().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [profile, language, refreshKey]);

  // Re-build message when language changes (without re-fetching forecast).
  useEffect(() => {
    if (ctx) {
      setBrief(buildBriefMessage(ctx, language));
    }
  }, [language, ctx]);

  const handleSendWhatsApp = useCallback(() => {
    if (!brief) return;
    const url = `https://wa.me/?text=${encodeURIComponent(brief)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [brief]);

  const handleCopy = useCallback(async () => {
    if (!brief) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(brief);
      } else {
        // Fallback for older browsers / non-secure contexts.
        const ta = document.createElement('textarea');
        ta.value = brief;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast({
        title: pick(language, COPY.copiedToast),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: pick(language, COPY.copiedToast),
        variant: 'destructive',
      });
    }
  }, [brief, language]);

  const handleScheduleDaily = useCallback(() => {
    const next = !scheduled;
    setDailyBriefSchedule({
      enabled: next,
      time: '06:00',
      language,
    });
    setScheduled(next);
    toast({
      title: next ? pick(language, COPY.scheduledToast) : pick(language, {
        en: 'Daily schedule disabled',
        fr: 'Planification quotidienne désactivée',
        ar: 'تم تعطيل الجدولة اليومية',
      }),
    });
  }, [scheduled, language]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Render ------------------------------------------------------------------

  const noProfile = !profile?.setupCompleted || !profile.crop;
  const crop = profile?.crop ? getCropById(profile.crop) : undefined;
  const noCrop = profile?.setupCompleted && profile.crop && !crop;

  return (
    <CalculatorShell
      icon={MessageCircle}
      accent="emerald"
      badge="Daily Brief"
      title={COPY.title}
      description={COPY.description}
      actions={[
        {
          icon: RefreshCw,
          label: COPY.refresh,
          onClick: handleRefresh,
        },
        {
          icon: Copy,
          label: COPY.copy,
          onClick: handleCopy,
          showCheck: copied,
        },
        {
          icon: CalendarClock,
          label: {
            en: scheduled ? 'Daily: ON' : 'Schedule Daily',
            fr: scheduled ? 'Quotidien: ON' : 'Planifier',
            ar: scheduled ? 'يومي: مفعّل' : 'جدولة يومية',
          },
          onClick: handleScheduleDaily,
          variant: scheduled ? 'primary' : 'ghost',
        },
        {
          icon: MessageCircle,
          label: COPY.sendWhatsapp,
          onClick: handleSendWhatsApp,
          variant: 'primary',
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="space-y-4">
          {/* Status banner */}
          {noProfile && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-0.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  {pick(language, COPY.noProfile)}
                </p>
              </div>
            </div>
          )}
          {noCrop && !noProfile && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-0.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  {pick(language, COPY.noCrop)}
                </p>
              </div>
            </div>
          )}

          {/* Brief summary cards */}
          {ctx && !noProfile && !noCrop && (
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                label={pick(language, {
                  en: 'Crop',
                  fr: 'Culture',
                  ar: 'المحصول',
                })}
                value={`${ctx.crop.emoji} ${ctx.crop.name[language]}`}
              />
              <SummaryCard
                label={pick(language, {
                  en: 'Stage',
                  fr: 'Stade',
                  ar: 'المرحلة',
                })}
                value={
                  ctx.activeStage
                    ? `${CROP_STAGE_LABELS[ctx.activeStage.stage].emoji} ${CROP_STAGE_LABELS[ctx.activeStage.stage].label[language]}`
                    : '—'
                }
              />
              <SummaryCard
                label={pick(language, {
                  en: "Today's ET₀",
                  fr: 'ET₀ du jour',
                  ar: 'ET₀ اليوم',
                })}
                value={ctx.today ? `${ctx.today.et0.toFixed(1)} mm` : '—'}
              />
              <SummaryCard
                label={pick(language, {
                  en: 'Rain',
                  fr: 'Pluie',
                  ar: 'الأمطار',
                })}
                value={ctx.today ? `${ctx.today.precipitationSum.toFixed(1)} mm` : '—'}
              />
              <SummaryCard
                label={pick(language, {
                  en: 'Irrigation',
                  fr: 'Irrigation',
                  ar: 'الري',
                })}
                value={ctx.irrigation ? `${ctx.irrigation.totalM3PerDay} m³` : '—'}
                highlight
              />
              <SummaryCard
                label={pick(language, {
                  en: 'Alerts',
                  fr: 'Alertes',
                  ar: 'تنبيهات',
                })}
                value={ctx.alerts.length > 0 ? `${ctx.alerts.length}` : '0'}
                highlight={ctx.alerts.length > 0}
              />
            </div>
          )}

          {loading && !noProfile && (
            <div className="p-4 rounded-xl border bg-muted/40 text-xs text-muted-foreground">
              {pick(language, COPY.loading)}
            </div>
          )}

          {ctx?.error && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200">
              {pick(language, COPY.forecastError)}
            </div>
          )}

          {/* Schedule state hint */}
          {scheduled && (
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 text-[11px] text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>
                  {pick(language, {
                    en: 'Daily brief scheduled at 06:00 — notifications will fire while the app is open.',
                    fr: 'Brief quotidien planifié à 06:00 — les notifications se déclencheront tant que l\u2019application est ouverte.',
                    ar: 'تمت جدولة الملخّص اليومي عند 06:00 — ستطلق التنبيهات أثناء فتح التطبيق.',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {pick(language, COPY.preview)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {brief.length > 0 ? `${brief.length} chars` : ''}
            </span>
          </div>

          {brief ? (
            <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
              {/* WhatsApp-style header */}
              <div className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
                <span className="ms-auto text-[10px] font-normal opacity-80">
                  {new Date().toLocaleTimeString(
                    language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ',
                    { hour: '2-digit', minute: '2-digit' },
                  )}
                </span>
              </div>
              {/* WhatsApp-style bubble */}
              <pre
                className="p-4 text-[12px] leading-relaxed whitespace-pre-wrap break-words font-sans text-foreground max-h-[28rem] overflow-y-auto"
                style={{ fontFamily: 'inherit' }}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {brief}
              </pre>
            </div>
          ) : (
            !noProfile && !noCrop && (
              <div className="p-6 rounded-2xl border border-dashed text-center text-xs text-muted-foreground">
                {pick(language, COPY.loading)}
              </div>
            )
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border space-y-1 ${
        highlight
          ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30'
          : 'border-border bg-card'
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-bold text-foreground truncate">{value}</div>
    </div>
  );
}
