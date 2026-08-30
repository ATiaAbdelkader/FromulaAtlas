'use client';

/**
 * FarmerDecisionPopups — modal decision assistants for the Farmer Home tab.
 *
 * Replaces the old behaviour where 'What should I do today?', 'Should I
 * irrigate?' and 'Do I apply fertilizer?' would simply navigate to a tab +
 * collapsible. The new popups show:
 *
 *   - What should I do today?     → today's stage-relevant activities + CTA
 *                                  to open 'Your crop mission' planner
 *   - Should I irrigate?         → today's ET₀, Kc, rainfall, net need,
 *                                  spray advisory + CTA to open Water Budget
 *                                  Optimizer
 *   - Do I apply fertilizer?     → stage NPK uptake fractions, recommended
 *                                  kg/ha dose for today's stage + CTA to
 *                                  open 4R Nutrient Budget
 *
 * Each popup pulls the live farm profile + weather forecast (lazy — only
 * fetched when the popup opens), computes the active crop stage from
 * crop-lifecycle, and uses FarmPilot's engine for NPK stage-split doses
 * when the crop is mapped.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sprout, Droplets, FlaskConical, RefreshCw, AlertTriangle,
  CheckCircle2, CloudRain, Wind, ArrowRight, CalendarDays,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { useFarmProfile } from '@/components/agri/farm-profile-wizard';
import { getForecast, type ForecastResult } from '@/lib/open-meteo';
import { CROP_LIFECYCLES, stageForDay, type CropLifecycle } from '@/lib/crop-lifecycle';
import { localizedStageName, localizedStageDescription } from '@/lib/crop-lifecycle-i18n';
import { localizedCropName } from '@/lib/crop-localization';
import { ALL_58_WILAYAS } from '@/lib/algeria-wilayas-58';
import { mapLifecycleIdToFarmPilotId } from '@/components/agri/farmpilot-decision-card';
import { getCropById } from '@/lib/farmpilot-engine';
import { CROP_STAGE_LABELS } from '@/lib/farmpilot-data';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DecisionPopupType = 'what-to-do' | 'should-irrigate' | 'apply-fertilizer';

interface FarmerDecisionPopupsProps {
  /** Which popup is open (null = closed). */
  open: DecisionPopupType | null;
  /** Called when the user closes the popup (X / backdrop / button). */
  onClose: () => void;
  /** Open a tool tab + collapsible. */
  onOpenTool: (tab: 'farm' | 'calendar' | 'simulator', storageKey?: string) => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FarmerDecisionPopups({ open, onClose, onOpenTool }: FarmerDecisionPopupsProps) {
  return (
    <>
      <WhatToDoPopup open={open === 'what-to-do'} onClose={onClose} onOpenTool={onOpenTool} />
      <ShouldIrrigatePopup open={open === 'should-irrigate'} onClose={onClose} onOpenTool={onOpenTool} />
      <ApplyFertilizerPopup open={open === 'apply-fertilizer'} onClose={onClose} onOpenTool={onOpenTool} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared hook — load farm profile + weather + crop stage
// ---------------------------------------------------------------------------

interface FarmDecisionContext {
  profile: ReturnType<typeof useFarmProfile>;
  forecast: ForecastResult | null;
  weatherLoading: boolean;
  weatherError: string | null;
  locationName: string | null;
  lifecycle: CropLifecycle | null;
  dayOfSeason: number | null;
  stageName: string | null;
  stageDescription: string | null;
  /** Stage name localized to the current UI language. */
  localizedStageName: string | null;
  /** Stage description localized to the current UI language. */
  localizedStageDescription: string | null;
  /** Crop name localized to the current UI language. */
  localizedCropName: string | null;
  daysRemaining: number | null;
  percent: number | null;
}

function useFarmDecisionContext(active: boolean): FarmDecisionContext {
  const { language } = useTranslation();
  const profile = useFarmProfile();

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  // Lazy fetch only when popup is opened
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(null);

    (async () => {
      try {
        // Resolve lat/lng from farm_profile_v1 (preferred) or LAST_LOC_KEY
        let lat: number | undefined;
        let lng: number | undefined;
        try {
          const saved = localStorage.getItem('farm_profile_v1');
          if (saved) {
            const obj = JSON.parse(saved);
            const la = parseFloat(obj.lat), ln = parseFloat(obj.lng);
            if (Number.isFinite(la) && Number.isFinite(ln)) { lat = la; lng = ln; }
          }
        } catch { /* ignore */ }
        if (lat == null || lng == null) {
          try {
            const saved = localStorage.getItem('et_tracker_last_loc_v1');
            if (saved) {
              const obj = JSON.parse(saved);
              const la = parseFloat(obj.lat), ln = parseFloat(obj.lng);
              if (Number.isFinite(la) && Number.isFinite(ln)) { lat = la; lng = ln; }
            }
          } catch { /* ignore */ }
        }

        if (lat == null || lng == null) {
          setForecast(null);
          setLocationName(null);
          return;
        }

        // Reverse-lookup nearest wilaya for display name (skipped if the
        // user is more than 300 km from any Algerian wilaya, which means
        // they're likely outside Algeria).
        let best: { name: string; distanceKm: number } | null = null;
        for (const w of ALL_58_WILAYAS) {
          const x = (lng - w.lng) * Math.cos(((lat + w.lat) / 2) * Math.PI / 180);
          const y = (lat - w.lat);
          const distanceKm = Math.sqrt(x * x + y * y) * 111;
          if (!best || distanceKm < best.distanceKm) {
            best = {
              name: language === 'ar' ? w.nameAr : language === 'fr' ? w.nameFr : w.nameEn,
              distanceKm,
            };
          }
        }
        setLocationName(best && best.distanceKm <= 300 ? best.name : null);

        const f = await getForecast(lat, lng, { days: 4 });
        if (!cancelled) setForecast(f);
      } catch (e: any) {
        if (!cancelled) setWeatherError(e?.message || 'Weather unavailable');
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [active, language]);

  // Compute crop stage from lifecycle + plantingDate
  const lifecycle = useMemo(() => {
    if (!profile?.crop) return null;
    return CROP_LIFECYCLES.find((c) => c.id === profile.crop) ?? null;
  }, [profile?.crop]);

  const stageInfo = useMemo(() => {
    if (!lifecycle || !profile?.plantingDate) return null;
    const planting = new Date(profile.plantingDate + 'T00:00:00');
    const dayOfSeason = Math.floor((Date.now() - planting.getTime()) / 86400000) + 1;
    if (dayOfSeason < 1 || dayOfSeason > lifecycle.seasonLength) return null;
    const stage = stageForDay(lifecycle, dayOfSeason);
    const stageNameEn = stage?.name ?? null;
    const stageDescEn = stage?.description ?? null;
    return {
      dayOfSeason,
      // Keep English for keyword matching (todayActivities + activeFarmPilotStage)
      stageName: stageNameEn,
      stageDescription: stageDescEn,
      // Localized versions for display
      localizedStageName: stageNameEn ? localizedStageName(stageNameEn, language) : null,
      localizedStageDescription: stageDescEn ? localizedStageDescription(stageDescEn, language) : null,
      localizedCropNameVal: lifecycle ? localizedCropName(language, lifecycle.id, lifecycle.name) : null,
      daysRemaining: Math.max(0, lifecycle.seasonLength - dayOfSeason),
      percent: Math.min(100, Math.round((dayOfSeason / lifecycle.seasonLength) * 100)),
    };
  }, [lifecycle, profile?.plantingDate, language]);

  return {
    profile,
    forecast,
    weatherLoading,
    weatherError,
    locationName,
    lifecycle,
    dayOfSeason: stageInfo?.dayOfSeason ?? null,
    stageName: stageInfo?.stageName ?? null,
    stageDescription: stageInfo?.stageDescription ?? null,
    localizedStageName: stageInfo?.localizedStageName ?? null,
    localizedStageDescription: stageInfo?.localizedStageDescription ?? null,
    localizedCropName: stageInfo?.localizedCropNameVal ?? null,
    daysRemaining: stageInfo?.daysRemaining ?? null,
    percent: stageInfo?.percent ?? null,
  };
}

// ---------------------------------------------------------------------------
// Popup 1: What should I do today?
// ---------------------------------------------------------------------------

function WhatToDoPopup({
  open, onClose, onOpenTool,
}: {
  open: boolean;
  onClose: () => void;
  onOpenTool: (tab: 'farm' | 'calendar' | 'simulator', storageKey?: string) => void;
}) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const ctx = useFarmDecisionContext(open);

  const cropName = ctx.localizedCropName ?? ctx.lifecycle?.name ?? ctx.profile?.crop ?? tr('your crop', 'محصولك', 'votre culture');
  const cropEmoji = ctx.lifecycle?.emoji ?? '🌱';

  // Stage-relevant suggested activities
  const todayActivities = useMemo(() => {
    if (!ctx.stageName) return [];
    const stage = ctx.stageName.toLowerCase();
    const acts: { en: string; ar: string; fr: string; emoji: string }[] = [];

    if (stage.includes('veget') || stage.includes('croissance') || stage.includes('نمو')) {
      acts.push({ en: 'Light cultivation between rows', ar: 'حرث خفيف بين الصفوف', fr: 'Culture légère entre les rangs', emoji: '🌱' });
      acts.push({ en: 'Weed control', ar: 'مكافحة الأعشاب', fr: 'Désherbage', emoji: '🌿' });
      acts.push({ en: 'First NPK application', ar: 'إضافة NPK الأولى', fr: 'Premier apport NPK', emoji: '🧪' });
    }
    if (stage.includes('flower') || stage.includes('floraison') || stage.includes('إزهار')) {
      acts.push({ en: 'Stake / support plants', ar: 'دعم النباتات', fr: 'Tuteurage des plantes', emoji: '🌸' });
      acts.push({ en: 'Pest scouting — check for aphids', ar: 'كشف الآفات — افحص المن', fr: 'Surveillance des pucerons', emoji: '🔍' });
      acts.push({ en: 'Avoid spraying during bloom (bees)', ar: 'تجنب الرش أثناء الإزهار (النحل)', fr: 'Éviter les traitements pendant la floraison (abeilles)', emoji: '🐝' });
    }
    if (stage.includes('fruit') || stage.includes('development') || stage.includes('ثمار') || stage.includes('تكوين')) {
      acts.push({ en: 'Fruit thinning if overcrowded', ar: 'تخفيف الثمار إذا كانت مزدحمة', fr: 'Éclaircissage des fruits si nécessaire', emoji: '🍅' });
      acts.push({ en: 'Irrigate regularly (high demand)', ar: 'الري المنتظم (طلب مرتفع)', fr: 'Irrigation régulière (forte demande)', emoji: '💧' });
      acts.push({ en: 'Monitor for blossom-end rot', ar: 'راقب عفن طرف الثمرة', fr: 'Surveiller la pourriture apicale', emoji: '⚠️' });
    }
    if (stage.includes('matur') || stage.includes('نضج')) {
      acts.push({ en: 'Stop irrigation 7-10 days before harvest', ar: 'أوقف الري 7-10 أيام قبل الحصاد', fr: 'Arrêter l\'irrigation 7-10 jours avant récolte', emoji: '🌾' });
      acts.push({ en: 'Prepare harvest equipment', ar: 'جهّز معدات الحصاد', fr: 'Préparer le matériel de récolte', emoji: '🧺' });
    }
    if (stage.includes('germin') || stage.includes('establish') || stage.includes('إنبات')) {
      acts.push({ en: 'Keep soil moist for germination', ar: 'حافظ على رطوبة التربة للإنبات', fr: 'Maintenir le sol humide pour la germination', emoji: '💧' });
      acts.push({ en: 'Check plant stand density', ar: 'افحص كثافة البذور المنبتة', fr: 'Vérifier la densité de levée', emoji: '🔍' });
    }

    // Always include daily walk-the-field
    acts.push({ en: 'Walk the field — check for stress', ar: 'تجول في الحقل — ابحث عن إجهاد', fr: 'Parcourir le champ — vérifier le stress', emoji: '👁' });

    return acts.slice(0, 5);
  }, [ctx.stageName]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sprout className="h-5 w-5 text-emerald-600" />
            {tr('Today on your farm', 'اليوم في مزرعتك', "Aujourd'hui sur votre ferme")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Crop + stage summary */}
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{cropEmoji}</span>
              <div>
                <div className="font-bold">{cropName}</div>
                {ctx.localizedStageName && (
                  <div className="text-xs text-muted-foreground">
                    {tr('Stage', 'المرحلة', 'Stade')}: <span className="font-semibold text-foreground">{ctx.localizedStageName}</span>
                  </div>
                )}
              </div>
            </div>
            {ctx.dayOfSeason != null && (
              <div className="text-xs text-muted-foreground">
                {tr('Day', 'يوم', 'Jour')} {ctx.dayOfSeason}
                {ctx.daysRemaining != null && ` · ${ctx.daysRemaining} ${tr('days to harvest', 'يوماً للحصاد', 'jours avant récolte')}`}
              </div>
            )}
          </div>

          {/* Stage description (if any) */}
          {ctx.localizedStageDescription && (
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {ctx.localizedStageDescription}
            </p>
          )}

          {/* Today's activities */}
          {todayActivities.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tr('Suggested activities', 'الأنشطة المقترحة', 'Activités suggérées')}
              </div>
              <ul className="space-y-1">
                {todayActivities.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-base flex-shrink-0">{act.emoji}</span>
                    <span>{act[language]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {tr(
                'Set up your crop + planting date in the farm profile to get stage-specific recommendations.',
                'حدد محصولك وتاريخ الزراعة في ملف المزرعة للحصول على توصيات حسب المرحلة.',
                'Renseignez votre culture + date de plantation pour des recommandations par stade.',
              )}
            </p>
          )}

          {/* Weather note */}
          {ctx.forecast?.daily?.[0] && (
            <div className="text-xs text-muted-foreground border-t pt-2 flex items-center gap-2">
              <CloudRain className="h-3 w-3" />
              {tr('Today', 'اليوم', 'Aujourd\'hui')}: {Math.round(ctx.forecast.daily[0].tempMax)}° / {Math.round(ctx.forecast.daily[0].tempMin)}°C · {ctx.forecast.daily[0].precipitationSum.toFixed(1)} mm {tr('rain', 'مطر', 'pluie')}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onClose();
              onOpenTool('farm', 'crop_mission_planner');
            }}
          >
            <Sprout className="h-4 w-4" />
            {tr('Open Your Crop Mission', 'افتح مهمة المحصول', 'Ouvrir mission culture')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {tr('Close', 'إغلاق', 'Fermer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Popup 2: Should I irrigate?
// ---------------------------------------------------------------------------

function ShouldIrrigatePopup({
  open, onClose, onOpenTool,
}: {
  open: boolean;
  onClose: () => void;
  onOpenTool: (tab: 'farm' | 'calendar' | 'simulator', storageKey?: string) => void;
}) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const ctx = useFarmDecisionContext(open);

  const today = ctx.forecast?.daily?.[0];
  const current = ctx.forecast?.current;
  const eto = today?.et0 ?? 0;
  const rainfall = today?.precipitationSum ?? 0;
  const effectiveRainfall = rainfall * 0.8;
  const netIrrigation = Math.max(0, eto - effectiveRainfall);

  // Spray advisory based on wind + rain
  const sprayAdvisory = useMemo(() => {
    if (!today) return null;
    const wind = today.windSpeedMax ?? 0;
    const rain = today.precipitationSum ?? 0;
    if (wind > 20) {
      return {
        level: 'bad' as const,
        emoji: '🚫',
        label: { en: 'Do not spray — wind too strong', ar: 'لا ترش — الرياح قوية', fr: 'Ne pas traiter — vent trop fort' },
      };
    }
    if (rain > 4) {
      return {
        level: 'bad' as const,
        emoji: '🚫',
        label: { en: 'Do not spray — rain expected', ar: 'لا ترش — من المتوقع هطول أمطار', fr: 'Ne pas traiter — pluie attendue' },
      };
    }
    if (wind > 12 || rain > 1) {
      return {
        level: 'caution' as const,
        emoji: '⚠️',
        label: { en: 'Spray with caution — check conditions', ar: 'رش بحذر — تحقق من الظروف', fr: 'Traiter avec prudence — vérifier les conditions' },
      };
    }
    return {
      level: 'good' as const,
      emoji: '✅',
      label: { en: 'Good conditions for spraying', ar: 'ظروف جيدة للرش', fr: 'Bonnes conditions pour traiter' },
    };
  }, [today]);

  const recommendation = netIrrigation > 1
    ? {
      label: { en: 'Yes, irrigate today', ar: 'نعم، اسقِ اليوم', fr: 'Oui, irriguez aujourd\'hui' },
      color: 'text-amber-700 dark:text-amber-300',
      emoji: '💧',
    }
    : netIrrigation > 0.3
      ? {
        label: { en: 'Light irrigation if no rain expected', ar: 'ري خفيف إن لم يكن مطر متوقع', fr: 'Irrigation légère si pas de pluie' },
        color: 'text-sky-700 dark:text-sky-300',
        emoji: '🌤️',
      }
      : {
        label: { en: 'No irrigation needed today', ar: 'لا حاجة للري اليوم', fr: 'Pas d\'irrigation nécessaire aujourd\'hui' },
        color: 'text-emerald-700 dark:text-emerald-300',
        emoji: '✅',
      };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-5 w-5 text-sky-600" />
            {tr('Should I irrigate?', 'هل أسقي؟', 'Dois-je irriguer ?')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Recommendation */}
          <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-3">
            <span className="text-3xl">{recommendation.emoji}</span>
            <div>
              <div className={`font-bold ${recommendation.color}`}>{recommendation.label[language]}</div>
              {ctx.locationName && (
                <div className="text-xs text-muted-foreground mt-0.5">{ctx.locationName}</div>
              )}
            </div>
          </div>

          {/* Crop + stage */}
          {ctx.localizedStageName && (
            <div className="text-xs">
              <span className="text-muted-foreground">{tr('Crop stage', 'مرحلة المحصول', 'Stade culture')}: </span>
              <span className="font-semibold">{ctx.lifecycle?.emoji} {ctx.localizedCropName ?? ctx.lifecycle?.name} — {ctx.localizedStageName}</span>
            </div>
          )}

          {/* Water balance breakdown */}
          {today && (
            <div className="grid grid-cols-2 gap-2">
              <BalanceCard
                icon={<RefreshCw className="h-3 w-3" />}
                label={tr('ET₀ today', 'ET₀ اليوم', 'ET₀ aujourd\'hui')}
                value={`${eto.toFixed(1)} mm`}
                hint={tr('reference evapotranspiration', 'التبخر-نقل المرجعي', 'évapotranspiration de référence')}
              />
              <BalanceCard
                icon={<CloudRain className="h-3 w-3" />}
                label={tr('Rain today', 'المطر اليوم', 'Pluie aujourd\'hui')}
                value={`${rainfall.toFixed(1)} mm`}
                hint={tr('effective', 'فعّال', 'efficace')} sub={`${effectiveRainfall.toFixed(1)} mm`}
              />
              <BalanceCard
                icon={<Droplets className="h-3 w-3" />}
                label={tr('Net need', 'الاحتياج الصافي', 'Besoin net')}
                value={`${netIrrigation.toFixed(1)} mm`}
                hint={tr('ETc − rain', 'ETc − مطر', 'ETc − pluie')}
                emphasis
              />
              <BalanceCard
                icon={<Wind className="h-3 w-3" />}
                label={tr('Max wind', 'الرياح القصوى', 'Vent max')}
                value={`${(today.windSpeedMax ?? 0).toFixed(0)} km/h`}
                hint={tr('spray risk', 'خطر الرش', 'risque traitement')}
              />
            </div>
          )}

          {/* Spray advisory */}
          {sprayAdvisory && (
            <div className={cn(
              'rounded-lg p-2 text-xs flex items-center gap-2',
              sprayAdvisory.level === 'good' && 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200',
              sprayAdvisory.level === 'caution' && 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200',
              sprayAdvisory.level === 'bad' && 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200',
            )}>
              <span className="text-base">{sprayAdvisory.emoji}</span>
              <span>{sprayAdvisory.label[language]}</span>
            </div>
          )}

          {ctx.weatherLoading && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {tr('Fetching live weather…', 'جلب الطقس المباشر…', 'Récupération météo…')}
            </div>
          )}
          {ctx.weatherError && (
            <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              {tr('Weather unavailable', 'الطقس غير متاح', 'Météo indisponible')}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onClose();
              onOpenTool('farm', 'collapse_water_budget');
            }}
          >
            <Droplets className="h-4 w-4" />
            {tr('Open Water Budget Optimizer', 'افتح محسّن ميزانية المياه', 'Ouvrir l\'optimiseur bilan hydrique')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {tr('Close', 'إغلاق', 'Fermer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Popup 3: Do I apply fertilizer?
// ---------------------------------------------------------------------------

function ApplyFertilizerPopup({
  open, onClose, onOpenTool,
}: {
  open: boolean;
  onClose: () => void;
  onOpenTool: (tab: 'farm' | 'calendar' | 'simulator', storageKey?: string) => void;
}) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const ctx = useFarmDecisionContext(open);

  // Map to FarmPilot crop + compute stage-split dose
  const farmPilotCropId = mapLifecycleIdToFarmPilotId(ctx.profile?.crop);
  const farmPilotCrop = farmPilotCropId ? getCropById(farmPilotCropId) : null;

  // Find today's stage in FarmPilot's stage progression (approximate by
  // matching stage name to CROP_STAGE_LABELS)
  const activeFarmPilotStage = useMemo(() => {
    if (!farmPilotCrop || !ctx.stageName) return null;
    const stageLower = ctx.stageName.toLowerCase();
    // Map lifecycle stage name to FarmPilot stage
    if (stageLower.includes('germin') || stageLower.includes('إنبات')) return 'germination' as const;
    if (stageLower.includes('veget') || stageLower.includes('croissance') || stageLower.includes('نمو')) return 'vegetative' as const;
    if (stageLower.includes('flower') || stageLower.includes('floraison') || stageLower.includes('إزهار')) return 'flowering' as const;
    if (stageLower.includes('fruit') || stageLower.includes('development') || stageLower.includes('ثمار') || stageLower.includes('تكوين')) return 'fruit_development' as const;
    if (stageLower.includes('matur') || stageLower.includes('نضج')) return 'maturation' as const;
    return null;
  }, [farmPilotCrop, ctx.stageName]);

  // Calculate the NPK split dose for today's stage
  const doseInfo = useMemo(() => {
    if (!farmPilotCrop || !activeFarmPilotStage) return null;
    const crop = farmPilotCrop;
    const stageData = crop.stages[activeFarmPilotStage];
    if (!stageData) return null;
    // Find previous stage's N uptake fraction to compute delta
    const stageOrder = ['planting', 'germination', 'vegetative', 'flowering', 'fruit_development', 'maturation', 'harvest'] as const;
    const idx = stageOrder.indexOf(activeFarmPilotStage);
    const prevStage = idx > 0 ? crop.stages[stageOrder[idx - 1]] : null;
    const fraction = stageData.nUptakeFraction - (prevStage?.nUptakeFraction ?? 0);
    // Total N demand (kg/ha) × fraction for this stage
    const stageN = crop.nutrientUptake.n * fraction;
    const stageP = crop.nutrientUptake.p * fraction;
    const stageK = crop.nutrientUptake.k * fraction;
    // Product 15-15-15: 15% N → required product = stageN / 0.15
    const npkPct = 0.15;
    const requiredProductKgPerHa = stageN / npkPct;
    return {
      stageN: Math.round(stageN * 10) / 10,
      stageP: Math.round(stageP * 10) / 10,
      stageK: Math.round(stageK * 10) / 10,
      fraction: Math.round(fraction * 100),
      requiredProductKgPerHa: Math.round(requiredProductKgPerHa),
      totalN: crop.nutrientUptake.n,
    };
  }, [farmPilotCrop, activeFarmPilotStage]);

  const today = new Date();
  const todayStr = today.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-5 w-5 text-amber-600" />
            {tr('Do I apply fertilizer?', 'هل أُسمد؟', 'Dois-je fertiliser ?')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Date + crop summary */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{tr('Date', 'التاريخ', 'Date')}</span>
              <span className="font-semibold">{todayStr}</span>
            </div>
            {ctx.lifecycle && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr('Crop', 'المحصول', 'Culture')}</span>
                <span className="font-semibold">{ctx.lifecycle.emoji} {ctx.localizedCropName ?? ctx.lifecycle.name}</span>
              </div>
            )}
            {ctx.localizedStageName && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr('Stage', 'المرحلة', 'Stade')}</span>
                <span className="font-semibold">{ctx.localizedStageName}</span>
              </div>
            )}
            {ctx.dayOfSeason != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{tr('Day of season', 'يوم من الموسم', 'Jour de saison')}</span>
                <span className="font-semibold">{ctx.dayOfSeason}</span>
              </div>
            )}
          </div>

          {/* Dose recommendation */}
          {doseInfo ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tr('Recommended dose for this stage', 'الجرعة الموصى بها لهذه المرحلة', 'Dose recommandée pour ce stade')}
              </div>

              {/* NPK stage fractions */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">N</div>
                  <div className="font-bold tabular-nums">{doseInfo.stageN}</div>
                  <div className="text-[10px] text-muted-foreground">kg/ha</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">P</div>
                  <div className="font-bold tabular-nums">{doseInfo.stageP}</div>
                  <div className="text-[10px] text-muted-foreground">kg/ha</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">K</div>
                  <div className="font-bold tabular-nums">{doseInfo.stageK}</div>
                  <div className="text-[10px] text-muted-foreground">kg/ha</div>
                </div>
              </div>

              {/* Product requirement */}
              <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/30 p-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tr('15-15-15 product', 'سماد 15-15-15', 'Engrais 15-15-15')}</span>
                  <span className="font-mono font-bold tabular-nums">{doseInfo.requiredProductKgPerHa} kg/ha</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tr('Stage fraction', 'نسبة المرحلة', 'Part du stade')}</span>
                  <span className="font-mono">{doseInfo.fraction}% {tr('of total N', 'من إجمالي N', 'de l\'azote total')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tr('Total cycle N', 'إجمالي N للدورة', 'N total du cycle')}</span>
                  <span className="font-mono">{doseInfo.totalN} kg/ha</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                {tr(
                  'These are reference doses for the active stage. Adjust based on your soil test results.',
                  'هذه جرعات مرجعية للمرحلة النشطة. عدّلها بناءً على نتائج تحليل التربة.',
                  'Doses de référence pour le stade actuel. Ajustez selon vos analyses de sol.',
                )}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {ctx.profile?.crop
                ? tr(
                  'This crop is not yet in the FarmPilot database. Use the 4R Nutrient Budget tool to calculate manually.',
                  'هذا المحصول غير موجود بعد في قاعدة بيانات FarmPilot. استخدم أداة ميزانية 4R للحساب اليدوي.',
                  'Cette culture n\'est pas encore dans la base FarmPilot. Utilisez l\'outil Budget 4R pour calculer manuellement.',
                )
                : tr(
                  'Set up your crop + planting date to get stage-specific fertilizer recommendations.',
                  'حدد محصولك وتاريخ الزراعة للحصول على توصيات تسميد حسب المرحلة.',
                  'Renseignez votre culture + date de plantation pour des recommandations par stade.',
                )}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onClose();
              onOpenTool('farm', 'collapse_nutrient_budget');
            }}
          >
            <FlaskConical className="h-4 w-4" />
            {tr('Open 4R Nutrient Budget', 'افتح ميزانية 4R الغذائية', 'Ouvrir Budget 4R')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {tr('Close', 'إغلاق', 'Fermer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Helper sub-component — small balance card
// ---------------------------------------------------------------------------

function BalanceCard({
  icon, label, value, hint, sub, emphasis,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-lg p-2 border',
      emphasis ? 'border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20' : 'border-border bg-muted/20',
    )}>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('font-mono font-bold tabular-nums', emphasis && 'text-sky-700 dark:text-sky-300')}>
        {value}
      </div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
      {hint && <div className="text-[9px] text-muted-foreground italic">{hint}</div>}
    </div>
  );
}
