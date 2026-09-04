'use client';

/**
 * TodayCard — the farmer's morning brief, rendered as a card in the app.
 *
 * This is the "why you opened the app today" view. Shows:
 *   1. Greeting + farm name + date
 *   2. Weather chip (temp + rain + ET₀)
 *   3. Irrigation recommendation (yes/no + m³ + duration)
 *   4. Top 3 tasks for today (with checkboxes)
 *   5. Weather alerts (if any)
 *   6. Quick links: "Open WhatsApp brief" / "Subscribe"
 *
 * Reuses the same FarmPilot engine functions as the WhatsApp brief
 * (calculateIrrigation, generateTodayTasks, getActiveStage) so the
 * in-app card and the WhatsApp message always show the same recommendations.
 *
 * Designed to be scannable in 30 seconds. Everything else (full dashboard,
 * tools, calculators) is one tap away.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sun, CloudRain, Droplets, FlaskConical, CheckCircle2, Circle,
  AlertTriangle, Bell, ArrowRight, ArrowLeft, Loader2, RefreshCw,
  Thermometer, Wind,
} from 'lucide-react';
import { useFarmProfile } from '@/components/agri/farm-profile-wizard';
import { useSyncedFarmProfile } from '@/lib/farm-profile-sync';
import { useTranslation, copyFor } from '@/lib/language-store';
import { getForecast, type ForecastResult, type DailyForecast } from '@/lib/open-meteo';
import {
  getCropById, getActiveStage, calculateIrrigation, generateTodayTasks,
  type IrrigationResult, type StageProgress, type TodayTask,
} from '@/lib/farmpilot-engine';
import { CROP_STAGE_LABELS, type FarmPilotPlan } from '@/lib/farmpilot-data';
import { toFarmPilotId } from '@/lib/crop-id-unified';
import { ALL_58_WILAYAS } from '@/lib/algeria-wilayas-58';
import { localizedWeatherLabel } from '@/lib/weather-localization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TodayCardProps {
  onOpenTool?: (tab: string, storageKey?: string) => void;
}

export function TodayCard({ onOpenTool }: TodayCardProps) {
  const { language, isRTL } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  // Use synced profile — pulls from Postgres if logged in + localStorage empty,
  // otherwise uses localStorage (fast). Falls back to useFarmProfile if the
  // synced hook isn't available (e.g., during SSR).
  const { profile, loading: profileLoading } = useSyncedFarmProfile();
  const localProfile = useFarmProfile();
  // Prefer synced profile; fall back to local (covers logged-out users)
  const effectiveProfile = profile ?? localProfile;
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Load forecast
  useEffect(() => {
    if (!effectiveProfile?.lat || !effectiveProfile?.lng) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const f = await getForecast(parseFloat(effectiveProfile.lat!), parseFloat(effectiveProfile.lng!), { days: 4 });
        if (!cancelled) {
          setForecast(f);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Weather unavailable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveProfile?.lat, effectiveProfile?.lng]);

  // Compute brief data (mirrors buildBriefForFarmer logic)
  const briefData = useMemo(() => {
    if (!effectiveProfile?.crop || !effectiveProfile?.plantingDate) return null;

    const farmPilotCropId = toFarmPilotId(effectiveProfile.crop);
    const crop = farmPilotCropId ? getCropById(farmPilotCropId) : undefined;
    if (!crop) return null;

    const activeStage = getActiveStage(crop, effectiveProfile.plantingDate);
    const today = forecast?.daily?.[0];

    const etoMmPerDay = today?.et0 ?? 5.0;
    const rainfallMm = today?.precipitationSum ?? 0;

    const plan: FarmPilotPlan = {
      cropId: crop.id,
      plantingDate: effectiveProfile.plantingDate,
      areaHa: effectiveProfile.area ?? 0.5,
      productionSystem: 'open_field',
      irrigationSystem: 'drip',
      irrigationFlowLph: 2000,
      fertilizerProduct: '15-15-15',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    let irrigation: IrrigationResult | null = null;
    if (activeStage) {
      try {
        irrigation = calculateIrrigation(crop, activeStage.stage, plan, etoMmPerDay, rainfallMm);
      } catch { /* ignore */ }
    }

    let tasks: TodayTask[] = [];
    try {
      tasks = generateTodayTasks(crop, plan, activeStage, etoMmPerDay);
    } catch { /* ignore */ }

    // Detect alerts
    const alerts: Array<{ kind: 'frost' | 'heat' | 'wind'; day: DailyForecast }> = [];
    if (forecast?.daily) {
      for (const day of forecast.daily.slice(0, 3)) {
        if (day.tempMin < 2) alerts.push({ kind: 'frost', day });
        if (day.tempMax >= 38) alerts.push({ kind: 'heat', day });
        if (day.windSpeedMax >= 50) alerts.push({ kind: 'wind', day });
      }
    }

    return { crop, activeStage, today, irrigation, tasks, alerts };
  }, [effectiveProfile, forecast]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('Good morning', 'صباح الخير', 'Bonjour');
    if (h < 17) return t('Good afternoon', 'نهارك سعيد', 'Bon après-midi');
    return t('Good evening', 'مساء الخير', 'Bonsoir');
  }, [t]);

  const toggleTask = useCallback((taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  // No farm profile set up
  if (!effectiveProfile?.setupCompleted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {t(
              'Set up your farm profile to get your daily brief.',
              'أعدّ ملف مزرعتك للحصول على ملخصك اليومي.',
              'Configurez votre profil de ferme pour recevoir votre brief quotidien.',
            )}
          </p>
          <Button
            onClick={() => onOpenTool?.('farm')}
            variant="default"
            size="sm"
          >
            {t('Set up farm', 'إعداد المزرعة', 'Configurer la ferme')}
            <DirectionArrow className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('Loading your brief…', 'جارٍ تحميل ملخصك…', 'Chargement de votre brief…')}
        </CardContent>
      </Card>
    );
  }

  const today = briefData?.today;
  const stage = briefData?.activeStage;
  const stageLabel = stage ? `${CROP_STAGE_LABELS[stage.stage].emoji} ${CROP_STAGE_LABELS[stage.stage].label[language]}` : '';

  return (
    <div className="space-y-3">
      {/* Header: greeting + date */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-bold">
            {greeting} 👋
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(
              isArabic ? 'ar-DZ' : isFrench ? 'fr-FR' : 'en-GB',
              { weekday: 'long', month: 'long', day: 'numeric' },
            )}
          </p>
        </div>
        {briefData?.crop && (
          <div className="text-right">
            <p className="text-sm font-semibold">
              {briefData.crop.emoji} {briefData.crop.name[language]}
            </p>
            {stageLabel && (
              <p className="text-xs text-muted-foreground">{stageLabel}</p>
            )}
          </div>
        )}
      </div>

      {/* Weather chip */}
      {today && (
        <Card className="overflow-hidden">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{wmoEmoji(today.weatherCode)}</span>
                <div>
                  <p className="text-sm font-medium">
                    {localizedWeatherLabel(today.weatherCode, language)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {today.tempMin.toFixed(0)}° → {today.tempMax.toFixed(0)}°C
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">{today.precipitationSum.toFixed(1)}mm</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">ET₀ {today.et0?.toFixed(1) ?? '—'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather alerts */}
      {briefData && briefData.alerts.length > 0 && (
        <div className="space-y-2">
          {briefData.alerts.map((alert, i) => (
            <AlertBanner key={i} alert={alert} language={language} />
          ))}
        </div>
      )}

      {/* Irrigation recommendation */}
      {briefData?.irrigation && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">
                    {t('Irrigation today', 'ري اليوم', 'Irrigation du jour')}
                  </h3>
                  <Badge variant="default" className="text-[10px]">
                    {briefData.irrigation.totalM3PerDay} m³
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {briefData.irrigation.irrigationDurationMinutes
                    ? t(
                        `${briefData.irrigation.irrigationDurationMinutes} min via drip`,
                        `${briefData.irrigation.irrigationDurationMinutes} دقيقة بالتنقيط`,
                        `${briefData.irrigation.irrigationDurationMinutes} min au goutte-à-goutte`,
                      )
                    : t('No irrigation needed', 'لا حاجة للري', 'Pas d\'irrigation nécessaire')
                  }
                  {briefData.irrigation.effectiveRainfallMm > 0 && (
                    <span className="ml-2 text-blue-600">
                      · {t('rain deducted', 'مخصوم المطر', 'pluie déduite')}: {briefData.irrigation.effectiveRainfallMm.toFixed(1)}mm
                    </span>
                  )}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1 text-xs"
                  onClick={() => onOpenTool?.('farm', 'collapse_water_budget')}
                >
                  {t('Open Water Budget', 'افتح ميزانية المياه', 'Ouvrir le budget eau')}
                  <DirectionArrow className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 tasks */}
      {briefData?.tasks && briefData.tasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {t('Top tasks today', 'أهم مهام اليوم', 'Priorités du jour')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {briefData.tasks.slice(0, 3).map((task) => {
              const isDone = completedTasks.has(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors text-left"
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className={cn('flex-1 min-w-0', isDone && 'line-through opacity-50')}>
                    <span className="text-sm font-medium">
                      {task.emoji} {task.title[language]}
                    </span>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.detail[language]}
                    </p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 px-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onOpenTool?.('farm')}
        >
          {t('Full farm', 'المزرعة كاملة', 'Ferme complète')}
          <DirectionArrow className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => window.open('/subscribe', '_self')}
        >
          <Bell className="h-3.5 w-3.5" />
          {t('WhatsApp brief', 'ملخص واتساب', 'Brief WhatsApp')}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wmoEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '🌤️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

function AlertBanner({ alert, language }: { alert: { kind: 'frost' | 'heat' | 'wind'; day: DailyForecast }; language: 'en' | 'fr' | 'ar' }) {
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const config = {
    frost: {
      icon: '❄️',
      color: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900/30 dark:bg-cyan-950/20 dark:text-cyan-200',
      label: t('Frost alert', 'تحذير صقيع', 'Alerte gel'),
      detail: t(
        `Min ${alert.day.tempMin.toFixed(1)}°C tonight — protect sensitive crops.`,
        `الصغرى ${alert.day.tempMin.toFixed(1)}°م الليلة — احمِ المحاصيل الحساسة.`,
        `Min ${alert.day.tempMin.toFixed(1)}°C cette nuit — protégez les cultures sensibles.`,
      ),
    },
    heat: {
      icon: '🔥',
      color: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200',
      label: t('Heat alert', 'تحذير حر', 'Alerte chaleur'),
      detail: t(
        `Max ${alert.day.tempMax.toFixed(1)}°C — irrigate early morning.`,
        `الكبرى ${alert.day.tempMax.toFixed(1)}°م — اسقِ صباحاً مبكراً.`,
        `Max ${alert.day.tempMax.toFixed(1)}°C — irriguez tôt le matin.`,
      ),
    },
    wind: {
      icon: '💨',
      color: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200',
      label: t('Wind alert', 'تحذير رياح', 'Alerte vent'),
      detail: t(
        `Gusts up to ${alert.day.windSpeedMax.toFixed(0)} km/h — delay spraying.`,
        `هبّات حتى ${alert.day.windSpeedMax.toFixed(0)} كم/س — أجّل الرش.`,
        `Rafales jusqu'à ${alert.day.windSpeedMax.toFixed(0)} km/h — reportez les traitements.`,
      ),
    },
  }[alert.kind];

  return (
    <div className={cn('rounded-lg border p-3 flex items-start gap-2 text-sm', config.color)}>
      <span className="text-lg flex-shrink-0">{config.icon}</span>
      <div>
        <p className="font-semibold">{config.label}</p>
        <p className="text-xs opacity-90">{config.detail}</p>
      </div>
    </div>
  );
}
