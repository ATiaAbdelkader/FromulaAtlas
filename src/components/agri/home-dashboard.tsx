'use client';

/**
 * Home Dashboard — personalized landing page replacing the "list of tools" Home tab.
 *
 * Widgets:
 *   1. Welcome header with farm name (from localStorage)
 *   2. Weather + ET₀ widget (Open-Meteo, no key, auto-fetch by saved location)
 *   3. Quick actions (4 big buttons)
 *   4. Recent tools (from tool-registry's localStorage)
 *   5. Quick navigation cards (the original 4 tab cards, preserved)
 *
 * All data is localStorage-backed — no auth required.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cloud, Sun, Droplets, MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  Sprout, Clock, Sparkles, Tractor, BookOpen, Wrench, Pin,
  ArrowRight, Zap, Calendar, Thermometer, Wind, CloudRain, Activity, Radio,
  SlidersHorizontal,
} from 'lucide-react';
import {
  TelemetryThresholdsDialog,
  type TelemetryThresholdConfig,
  DEFAULT_TELEMETRY_THRESHOLDS,
  loadSavedThresholds,
  THRESHOLDS_STORAGE_KEY,
} from '@/components/agri/telemetry-thresholds-dialog';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';
import {
  getForecast, wmoDescription, type ForecastResult,
} from '@/lib/open-meteo';
import {
  getRecentTools, getPinnedTools, recordToolUse,
  TOOL_PINS_CHANGED_EVENT,
  type ToolEntry,
} from '@/lib/tool-registry';
import { WeatherAlertBanner } from '@/components/agri/weather-alert-banner';
import { FarmStats } from '@/components/agri/farm-stats';
import { TodayTasks } from '@/components/agri/today-tasks';
import { SoilMoistureTrendChart } from '@/components/agri/soil-moisture-trend-chart';
import { FarmProfileWizard, needsFarmProfileSetup } from '@/components/agri/farm-profile-wizard';
import { useTranslation, type Language } from '@/lib/language-store';
import { type TabId, type UserLevel } from '@/lib/user-level';
import { FREE_TOOL_COUNT, FORMULA_COUNT } from '@/lib/catalog-stats';
import { localizeToolEntry } from '@/lib/tool-registry';
import { formatWeatherDate, localizedWeatherLabel } from '@/lib/weather-localization';
import { localizedCropName } from '@/lib/crop-localization';

const FARM_PROFILE_KEY = 'farm_profile_v1';
const LAST_LOC_KEY = 'et_tracker_last_loc_v1';

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

type RoleCopy = { en: string; fr: string; ar: string };

function copyForLevel(language: Language, level: UserLevel, farmer: RoleCopy, manager: RoleCopy, professional: RoleCopy) {
  const selected = level === 'farmer' ? farmer : level === 'manager' ? manager : professional;
  return copyFor(language, selected.en, selected.fr, selected.ar);
}

interface FarmProfile {
  name?: string;
  area?: number;
  mainCrops?: string;
  crop?: string;
  plantingDate?: string;
  lat?: string;
  lng?: string;
  setupCompleted?: boolean;
  location?: { lat?: number; lng?: number };
}

interface TelemetryThresholdStatus {
  isExceeded: boolean;
  severity: 'normal' | 'warning' | 'danger';
  icon: typeof Droplets | typeof AlertTriangle;
  borderClass: string;
  bgClass: string;
  iconClass: string;
  badgeLabel?: string;
  tooltip: string;
}

function evaluateTelemetrySafety(
  chipId: 'rh' | 'wind' | 'hilo' | 'rain',
  current: { relativeHumidity: number; windSpeed10m: number; temperature: number },
  today: { tempMax: number; tempMin: number; precipitationSum: number; et0: number },
  language: Language,
  thresholds: TelemetryThresholdConfig = DEFAULT_TELEMETRY_THRESHOLDS,
): TelemetryThresholdStatus {
  if (chipId === 'rh') {
    const rh = current.relativeHumidity;
    if (rh >= thresholds.rhExtreme) {
      return {
        isExceeded: true,
        severity: 'danger',
        icon: AlertTriangle,
        borderClass: 'border-rose-500/80 dark:border-rose-500/70 shadow-sm shadow-rose-500/10',
        bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
        iconClass: 'text-rose-600 dark:text-rose-400',
        badgeLabel: copyFor(language, 'Fungal Risk', 'Risque fongique', 'خطر فطري مرتفع'),
        tooltip: copyFor(
          language,
          `RH ≥ ${thresholds.rhExtreme}%: Extreme air moisture promotes fungal spore germination and foliar blight.`,
          `HR ≥ ${thresholds.rhExtreme}% : Humidité extrême favorisant la germination des spores et maladies foliaires.`,
          `الرطوبة ≥ ${thresholds.rhExtreme}%: رطوبة فائقة تحفز إنبات الأبواغ الفطرية والأمراض الورقية.`,
        ),
      };
    }
    if (rh >= thresholds.rhHigh) {
      return {
        isExceeded: true,
        severity: 'warning',
        icon: AlertTriangle,
        borderClass: 'border-amber-500/80 dark:border-amber-500/70 shadow-sm shadow-amber-500/10',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
        iconClass: 'text-amber-600 dark:text-amber-400',
        badgeLabel: copyFor(language, 'High RH', 'HR élevée', 'رطوبة عالية'),
        tooltip: copyFor(
          language,
          `RH ≥ ${thresholds.rhHigh}%: Fungal disease hazard threshold exceeded.`,
          `HR ≥ ${thresholds.rhHigh}% : Seuil de risque de maladies cryptogamiques dépassé.`,
          `الرطوبة ≥ ${thresholds.rhHigh}%: تجاوز عتبة خطر انتشار الفطريات.`,
        ),
      };
    }
    if (rh < thresholds.rhLow) {
      return {
        isExceeded: true,
        severity: 'warning',
        icon: AlertTriangle,
        borderClass: 'border-amber-500/80 dark:border-amber-500/70 shadow-sm shadow-amber-500/10',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
        iconClass: 'text-amber-600 dark:text-amber-400',
        badgeLabel: copyFor(language, 'Dry Air', 'Air sec', 'جفاف جوي'),
        tooltip: copyFor(
          language,
          `RH < ${thresholds.rhLow}%: High vapor pressure deficit and stomatal closure stress.`,
          `HR < ${thresholds.rhLow}% : Fort déficit de pression de vapeur et stress hydrique.`,
          `الرطوبة < ${thresholds.rhLow}%: عجز ضغط بخاري مرتفع وإجهاد غلق الثغور.`,
        ),
      };
    }
    return {
      isExceeded: false,
      severity: 'normal',
      icon: Droplets,
      borderClass: 'border-border/70 dark:border-border/60',
      bgClass: 'bg-muted/30 dark:bg-muted/15',
      iconClass: 'text-sky-600 dark:text-sky-400',
      tooltip: copyFor(language, `RH in normal range (${thresholds.rhLow}–${thresholds.rhHigh}%)`, `HR dans la plage normale (${thresholds.rhLow}–${thresholds.rhHigh}%)`, `الرطوبة في النطاق الزراعي الطبيعي (${thresholds.rhLow}-${thresholds.rhHigh}%)`),
    };
  }

  if (chipId === 'wind') {
    const wind = current.windSpeed10m;
    if (wind >= thresholds.windDanger) {
      return {
        isExceeded: true,
        severity: 'danger',
        icon: AlertTriangle,
        borderClass: 'border-rose-500/80 dark:border-rose-500/70 shadow-sm shadow-rose-500/10',
        bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
        iconClass: 'text-rose-600 dark:text-rose-400',
        badgeLabel: copyFor(language, 'No Spray', 'Pas de pulv.', 'ممنوع الرش'),
        tooltip: copyFor(
          language,
          `Wind ≥ ${thresholds.windDanger} km/h: Severe drift hazard & mechanical crop stress. Spraying prohibited.`,
          `Vent ≥ ${thresholds.windDanger} km/h : Risque sévère de dérive. Traitements interdits.`,
          `الرياح ≥ ${thresholds.windDanger} كم/س: خطر شديد لانجراف الرش وممنوع المعالجة الميدانية.`,
        ),
      };
    }
    if (wind >= thresholds.windWarning) {
      return {
        isExceeded: true,
        severity: 'warning',
        icon: AlertTriangle,
        borderClass: 'border-amber-500/80 dark:border-amber-500/70 shadow-sm shadow-amber-500/10',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
        iconClass: 'text-amber-600 dark:text-amber-400',
        badgeLabel: copyFor(language, 'Drift Risk', 'Risque dérive', 'خطر انجراف'),
        tooltip: copyFor(
          language,
          `Wind ≥ ${thresholds.windWarning} km/h: Spray drift safety threshold exceeded. Use low-drift nozzles.`,
          `Vent ≥ ${thresholds.windWarning} km/h : Seuil de sécurité de dérive dépassé. Utiliser buses antidérive.`,
          `الرياح ≥ ${thresholds.windWarning} كم/س: تجاوز حد أمان الانجراف. يفضل استخدام فوهات مضادة للانجراف.`,
        ),
      };
    }
    return {
      isExceeded: false,
      severity: 'normal',
      icon: Wind,
      borderClass: 'border-border/70 dark:border-border/60',
      bgClass: 'bg-muted/30 dark:bg-muted/15',
      iconClass: 'text-teal-600 dark:text-teal-400',
      tooltip: copyFor(language, `Wind speed within safe spraying limit (< ${thresholds.windWarning} km/h)`, `Vitesse du vent sous le seuil de sécurité (< ${thresholds.windWarning} km/h)`, `سرعة الرياح ضمن حد الأمان للرش (< ${thresholds.windWarning} كم/س)`),
    };
  }

  if (chipId === 'hilo') {
    const min = today.tempMin;
    const max = today.tempMax;
    if (min <= thresholds.tempMinFrost) {
      return {
        isExceeded: true,
        severity: 'danger',
        icon: AlertTriangle,
        borderClass: 'border-blue-500/80 dark:border-blue-500/70 shadow-sm shadow-blue-500/10',
        bgClass: 'bg-blue-500/10 dark:bg-blue-500/15',
        iconClass: 'text-blue-600 dark:text-blue-400',
        badgeLabel: copyFor(language, 'Frost Risk', 'Alerte gel', 'خطر صقيع'),
        tooltip: copyFor(
          language,
          `Min temp ≤ ${thresholds.tempMinFrost}°C: Freezing hazard to sensitive vegetative tissue and flowers.`,
          `T° min ≤ ${thresholds.tempMinFrost}°C : Risque de gelée pour les tissus végétatifs sensibles.`,
          `حرارة دنيا ≤ ${thresholds.tempMinFrost}°م: خطر حدوث صقيع وتلف الأنسجة النباتية الحساسة.`,
        ),
      };
    }
    if (max >= thresholds.tempMaxDanger) {
      return {
        isExceeded: true,
        severity: 'danger',
        icon: AlertTriangle,
        borderClass: 'border-rose-500/80 dark:border-rose-500/70 shadow-sm shadow-rose-500/10',
        bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
        iconClass: 'text-rose-600 dark:text-rose-400',
        badgeLabel: copyFor(language, 'Heat Alert', 'Canicule', 'حرارة حرجة'),
        tooltip: copyFor(
          language,
          `Max temp ≥ ${thresholds.tempMaxDanger}°C: Severe heat stress and flower abortion limit exceeded.`,
          `T° max ≥ ${thresholds.tempMaxDanger}°C : Stress thermique sévère et avortement floral.`,
          `حرارة قصوى ≥ ${thresholds.tempMaxDanger}°م: إجهاد حراري حاد وخطر تساقط وعقم الأزهار.`,
        ),
      };
    }
    if (max >= thresholds.tempMaxWarning) {
      return {
        isExceeded: true,
        severity: 'warning',
        icon: AlertTriangle,
        borderClass: 'border-amber-500/80 dark:border-amber-500/70 shadow-sm shadow-amber-500/10',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
        iconClass: 'text-amber-600 dark:text-amber-400',
        badgeLabel: copyFor(language, 'High Heat', 'Forte chaleur', 'حرارة عالية'),
        tooltip: copyFor(
          language,
          `Max temp ≥ ${thresholds.tempMaxWarning}°C: Elevated evapotranspiration and crop water stress.`,
          `T° max ≥ ${thresholds.tempMaxWarning}°C : Évapotranspiration élevée et stress hydrique.`,
          `حرارة قصوى ≥ ${thresholds.tempMaxWarning}°م: ارتفاع التبخر والإجهاد المائي للمحصول.`,
        ),
      };
    }
    return {
      isExceeded: false,
      severity: 'normal',
      icon: Thermometer,
      borderClass: 'border-border/70 dark:border-border/60',
      bgClass: 'bg-muted/30 dark:bg-muted/15',
      iconClass: 'text-amber-600 dark:text-amber-400',
      tooltip: copyFor(language, 'Temperatures within normal agronomic range', 'Températures dans la plage agronomique normale', 'درجات الحرارة ضمن النطاق الزراعي المعتاد'),
    };
  }

  // chipId === 'rain'
  const rain = today.precipitationSum;
  if (rain >= thresholds.rainDanger) {
    return {
      isExceeded: true,
      severity: 'danger',
      icon: AlertTriangle,
      borderClass: 'border-blue-500/80 dark:border-blue-500/70 shadow-sm shadow-blue-500/10',
      bgClass: 'bg-blue-500/10 dark:bg-blue-500/15',
      iconClass: 'text-blue-600 dark:text-blue-400',
      badgeLabel: copyFor(language, 'Runoff Risk', 'Ruissellement', 'خطر جريان'),
      tooltip: copyFor(
        language,
        `Precipitation ≥ ${thresholds.rainDanger} mm: Severe soil saturation and fertilizer leaching risk.`,
        `Précipitations ≥ ${thresholds.rainDanger} mm : Risque élevé d’asphyxie racinaire et lessivage d’engrais.`,
        `أمطار ≥ ${thresholds.rainDanger} مم: خطر تشبع التربة وغسيل الأسمدة والجريان السطحي.`,
      ),
    };
  }
  if (rain >= thresholds.rainWarning) {
    return {
      isExceeded: true,
      severity: 'warning',
      icon: AlertTriangle,
      borderClass: 'border-amber-500/80 dark:border-amber-500/70 shadow-sm shadow-amber-500/10',
      bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
      iconClass: 'text-amber-600 dark:text-amber-400',
      badgeLabel: copyFor(language, 'Heavy Rain', 'Pluie forte', 'أمطار غزيرة'),
      tooltip: copyFor(
        language,
        `Precipitation ≥ ${thresholds.rainWarning} mm: Irrigation should be paused and field machinery avoided.`,
        `Précipitations ≥ ${thresholds.rainWarning} mm : Suspendre l’irrigation et limiter les passages d’engins.`,
        `أمطار ≥ ${thresholds.rainWarning} مم: ينصح بوقف الري وتجنب دخول الآلات الثقيلة للحقل.`,
      ),
    };
  }
  return {
    isExceeded: false,
    severity: 'normal',
    icon: CloudRain,
    borderClass: 'border-border/70 dark:border-border/60',
    bgClass: 'bg-muted/30 dark:bg-muted/15',
    iconClass: 'text-blue-600 dark:text-blue-400',
    tooltip: copyFor(language, 'Precipitation within normal operating bounds', 'Précipitations dans les limites normales d’opération', 'هطول الأمطار ضمن الحدود الطبيعية'),
  };
}

interface HomeDashboardProps {
  /** Active experience; recent and pinned tools are filtered to this level. */
  level: UserLevel;
  /** Navigate to a tab. */
  onNavigate: (tab: TabId) => void;
  /** Open a specific tool by storageKey. */
  onOpenTool: (tab: TabId, storageKey?: string) => void;
  /** Open the command palette. */
  onOpenSearch: () => void;
}

export function HomeDashboard({ level, onNavigate, onOpenTool, onOpenSearch }: HomeDashboardProps) {
  const [profile, setProfile] = useState<FarmProfile>({});
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [recent, setRecent] = useState<ToolEntry[]>([]);
  const [pinned, setPinned] = useState<ToolEntry[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [thresholds, setThresholds] = useState<TelemetryThresholdConfig>(DEFAULT_TELEMETRY_THRESHOLDS);
  const [thresholdsDialogOpen, setThresholdsDialogOpen] = useState(false);
  const [thresholdsDialogTab, setThresholdsDialogTab] = useState<'humidity' | 'wind' | 'temp' | 'rain'>('humidity');
  const { t, language } = useTranslation();

  // Load farm profile + thresholds + recent tools from localStorage on mount
  useEffect(() => {
    setThresholds(loadSavedThresholds());
    try {
      const saved = localStorage.getItem(FARM_PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch { /* ignore */ }
    setRecent(getRecentTools(level));
    setPinned(getPinnedTools(level));
    const syncPinned = () => setPinned(getPinnedTools(level));
    window.addEventListener(TOOL_PINS_CHANGED_EVENT, syncPinned);
    // Auto-open the wizard on first visit (when no profile exists)
    if (needsFarmProfileSetup()) {
      setTimeout(() => setWizardOpen(true), 1500);  // slight delay so the dashboard renders first
    }
    return () => window.removeEventListener(TOOL_PINS_CHANGED_EVENT, syncPinned);
  }, [level]);

  const handleSaveThresholds = (newConfig: TelemetryThresholdConfig) => {
    setThresholds(newConfig);
    try {
      localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(newConfig));
    } catch { /* ignore */ }
    setDataVersion(v => v + 1);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1200);
  };

  const openThresholdsFor = (tab: 'humidity' | 'wind' | 'temp' | 'rain') => {
    setThresholdsDialogTab(tab);
    setThresholdsDialogOpen(true);
  };

  // Fetch weather using saved location from ET Tracker
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      // Prefer the farm profile location, then fall back to the ET Tracker
      // location for existing users who have not completed the profile wizard.
      for (const key of [FARM_PROFILE_KEY, LAST_LOC_KEY]) {
        if (lat !== undefined && lng !== undefined) break;
        try {
          const saved = localStorage.getItem(key);
          if (!saved) continue;
          const obj = JSON.parse(saved);
          const la = parseFloat(obj.lat), ln = parseFloat(obj.lng);
          if (Number.isFinite(la) && Number.isFinite(ln)) {
            lat = la;
            lng = ln;
          }
        } catch { /* try the next stored location */ }
      }

      if (lat === undefined || lng === undefined) {
        setForecast(null);
        return;
      }

      const f = await getForecast(lat, lng, { days: 4 });
      setForecast(f);
      setDataVersion(v => v + 1);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1500);
    } catch (e: any) {
      setWeatherError(e?.message || 'Weather unavailable');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  useEffect(() => {
    const syncAfterRestore = () => {
      try {
        const saved = localStorage.getItem(FARM_PROFILE_KEY);
        setProfile(saved ? JSON.parse(saved) : {});
      } catch {
        setProfile({});
      }
      setRecent(getRecentTools(level));
      setPinned(getPinnedTools(level));
      setRefreshToken(token => token + 1);
      void fetchWeather();
    };
    window.addEventListener('formula-atlas-backup-restored', syncAfterRestore);
    return () => window.removeEventListener('formula-atlas-backup-restored', syncAfterRestore);
  }, [fetchWeather]);

  const today = forecast?.daily[0];
  const current = forecast?.current;

  return (
    <div className="space-y-4">
      {/* =================================================================== */}
      {/* Welcome header */}
      {/* =================================================================== */}
      <section className="bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 text-emerald-100 text-xs font-medium uppercase tracking-wide">
              <Sprout className="h-3.5 w-3.5" /> {profile.name ? `${profile.name}` : t.appSubtitle}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">
              {greeting(language)}, {copyForLevel(language, level, { en: 'farmer', fr: 'agriculteur', ar: 'أيها المزارع' }, { en: 'farm manager', fr: 'responsable de ferme', ar: 'مدير المزرعة' }, { en: 'agronomist', fr: 'agronome', ar: 'المهندس الزراعي' })} 👋
            </h2>
            <motion.p
              key={`welcome-weather-${today ? today.et0.toFixed(1) : 'none'}-${dataVersion}`}
              initial={{ opacity: 0.7, y: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-emerald-100 text-xs mt-1 flex items-center gap-1.5 flex-wrap"
            >
              {today && (
                <motion.span
                  animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block shrink-0"
                />
              )}
              <span>
                {today
                  ? copyFor(language, `Today's ET₀ is ${today.et0.toFixed(1)} mm · ${localizedWeatherLabel(today.weatherCode, language).toLowerCase()}`, `L’ET₀ du jour est de ${today.et0.toFixed(1)} mm · ${localizedWeatherLabel(today.weatherCode, language).toLowerCase()}`, `ET₀ اليوم هو ${today.et0.toFixed(1)} مم · ${localizedWeatherLabel(today.weatherCode, language)}`)
                  : copyFor(language, 'Loading today\'s conditions…', 'Chargement des conditions du jour…', 'جارٍ تحميل ظروف اليوم…')}
              </span>
            </motion.p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenSearch}
            className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0"
          >
            <Sparkles className="h-3.5 w-3.5" /> {copyFor(language, 'Search tools (⌘K)', 'Rechercher des outils (⌘K)', 'بحث في الأدوات (⌘K)')}
          </Button>
        </div>
      </section>

      {/* Weather alert banner — proactive warnings */}
      <WeatherAlertBanner forecast={forecast} />

      {/* Next best action — converts setup and weather data into a clear plan */}
      <TodayFocusPanel
        level={level}
        profile={profile}
        forecast={forecast}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        dataVersion={dataVersion}
        isPulsing={isPulsing}
        onSetup={() => setWizardOpen(true)}
        onOpenTool={onOpenTool}
        onRefresh={fetchWeather}
      />

      {/* Farm stats — aggregate counts */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{copyForLevel(language, level, { en: 'Your Farm at a Glance', fr: 'Votre ferme en un coup d’œil', ar: 'مزرعتك في لمحة' }, { en: 'Operations at a Glance', fr: 'Les opérations en un coup d’œil', ar: 'العمليات في لمحة' }, { en: 'Evidence at a Glance', fr: 'Les données probantes en un coup d’œil', ar: 'الأدلة في لمحة' })}</div>
        <FarmStats />
      </section>

      {/* =================================================================== */}
      {/* Weather + ET₀ widget */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Current weather — spans 2 cols on lg */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <MapPin className="h-3 w-3" /> {copyFor(language, 'Current Weather', 'Météo actuelle', 'الطقس الحالي')}
              </div>
              {forecast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20"
                >
                  <motion.span
                    animate={{ scale: [1, 1.45, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                  />
                  <span>{copyFor(language, 'Live Open-Meteo', 'Open-Meteo en direct', 'بث مباشر Open-Meteo')}</span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => openThresholdsFor('humidity')}
                aria-label={copyFor(language, 'Configure alert thresholds', 'Configurer les seuils d’alerte', 'تخصيص عتبات التنبيه')}
                title={copyFor(language, 'Customize sensor alert thresholds', 'Personnaliser les seuils d’alerte des capteurs', 'تخصيص حدود وعتبات تنبيه الحساسات')}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                onClick={fetchWeather}
                disabled={weatherLoading}
                aria-label={copyFor(language, 'Refresh weather', 'Actualiser la météo', 'تحديث الطقس')}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          {weatherLoading && <WeatherSkeleton />}

          {!weatherLoading && weatherError && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 py-4">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{copyFor(language, `Weather unavailable: ${weatherError}. ET Tracker still works — open it to set your location.`, `Météo indisponible : ${weatherError}. Le suivi de l’ET₀ reste disponible — ouvrez-le pour définir votre localisation.`, `الطقس غير متاح: ${weatherError}. متعقّب التبدّر لا يزال يعمل — افتحه لتحديد موقعك.`)}</span>
            </div>
          )}

          {!weatherLoading && !weatherError && (!current || !today) && (
            <div className="flex flex-col items-center justify-center gap-2 py-5 text-center">
              <MapPin className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                {copyForLevel(language, level, { en: 'Complete your farm profile to see local weather.', fr: 'Complétez le profil de votre ferme pour voir la météo locale.', ar: 'أكمل ملف مزرعتك لرؤية الطقس المحلي.' }, { en: 'Complete the operating profile to see local weather.', fr: 'Complétez le profil opérationnel pour voir la météo locale.', ar: 'أكمل ملف التشغيل لرؤية الطقس المحلي.' }, { en: 'Complete the site context to see local weather.', fr: 'Complétez le contexte du site pour voir la météo locale.', ar: 'أكمل سياق الموقع لرؤية الطقس المحلي.' })}
              </p>
              <Button size="sm" variant="outline" onClick={() => setWizardOpen(true)} className="h-7 text-[10px] gap-1">
                {copyForLevel(language, level, { en: 'Set up location', fr: 'Configurer la localisation', ar: 'إعداد الموقع' }, { en: 'Set operating location', fr: 'Configurer la localisation opérationnelle', ar: 'إعداد موقع التشغيل' }, { en: 'Set site location', fr: 'Configurer la localisation du site', ar: 'إعداد موقع الحقل' })} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {!weatherLoading && !weatherError && current && today && (
            <div className="space-y-3">
              {/* Current conditions row */}
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <motion.div
                  key={`w-icon-${current.weatherCode}-${dataVersion}`}
                  initial={{ scale: 0.85, opacity: 0.8 }}
                  animate={{
                    scale: isPulsing ? [1, 1.15, 1] : 1,
                    rotate: isPulsing ? [0, -5, 5, 0] : 0,
                    opacity: 1,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-4xl select-none shrink-0"
                >
                  {wmoDescription(current.weatherCode).icon}
                </motion.div>
                <div className="flex-1 min-w-[120px]">
                  <motion.div
                    key={`temp-${current.temperature.toFixed(1)}-${dataVersion}`}
                    initial={{ opacity: 0.8, y: -2 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isPulsing ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    className="text-2xl font-bold font-mono tracking-tight"
                  >
                    {current.temperature.toFixed(1)}°C
                  </motion.div>
                  <motion.div
                    key={`desc-${current.weatherCode}-${dataVersion}`}
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground truncate"
                  >
                    {localizedWeatherLabel(current.weatherCode, language)}
                  </motion.div>
                </div>

                {/* Telemetry Sensor Chips Grid with Visual Threshold Indicators & Config */}
                <div className="grid grid-cols-2 gap-2 text-xs w-full sm:w-auto">
                  {([
                    {
                      id: 'rh' as const,
                      tab: 'humidity' as const,
                      label: copyFor(language, 'RH', 'HR', 'الرطوبة'),
                      value: `${current.relativeHumidity}%`,
                    },
                    {
                      id: 'wind' as const,
                      tab: 'wind' as const,
                      label: copyFor(language, 'Wind', 'Vent', 'الرياح'),
                      value: `${current.windSpeed10m.toFixed(1)} km/h`,
                    },
                    {
                      id: 'hilo' as const,
                      tab: 'temp' as const,
                      label: copyFor(language, 'Hi/Lo', 'Max/Min', 'ع/من'),
                      value: `${today.tempMax.toFixed(0)}°/${today.tempMin.toFixed(0)}°`,
                    },
                    {
                      id: 'rain' as const,
                      tab: 'rain' as const,
                      label: copyFor(language, 'Rain', 'Pluie', 'المطر'),
                      value: `${today.precipitationSum.toFixed(1)} mm`,
                    },
                  ]).map((chip, i) => {
                    const threshold = evaluateTelemetrySafety(chip.id, current, today, language, thresholds);
                    const ChipIcon = threshold.icon;

                    return (
                      <motion.div
                        key={`${chip.id}-${dataVersion}`}
                        initial={{ opacity: 0.75, scale: 0.96 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          backgroundColor: isPulsing
                            ? threshold.isExceeded
                              ? ['rgba(245,158,11,0.22)', 'rgba(245,158,11,0.08)', 'transparent']
                              : ['rgba(16,185,129,0.16)', 'rgba(16,185,129,0.05)', 'transparent']
                            : undefined,
                          borderColor: isPulsing
                            ? threshold.isExceeded
                              ? ['rgba(245,158,11,0.7)', 'rgba(245,158,11,0.3)', 'var(--border)']
                              : ['rgba(16,185,129,0.45)', 'rgba(16,185,129,0.15)', 'var(--border)']
                            : undefined,
                        }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        title={threshold.tooltip}
                        className={`group relative flex flex-col justify-between gap-1 p-2 rounded-lg border transition-all min-w-[120px] ${
                          threshold.isExceeded
                            ? `${threshold.borderClass} ${threshold.bgClass}`
                            : 'border-border/70 dark:border-border/60 bg-muted/30 dark:bg-muted/15'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium truncate">
                            <ChipIcon className={`h-3.5 w-3.5 ${threshold.iconClass} shrink-0 transition-transform`} />
                            <span className="truncate">{chip.label}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {threshold.badgeLabel && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wider border leading-none ${
                                  threshold.severity === 'danger'
                                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {threshold.badgeLabel}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openThresholdsFor(chip.tab);
                              }}
                              aria-label={copyFor(language, `Configure ${chip.label} threshold`, `Configurer le seuil ${chip.label}`, `تخصيص عتبة ${chip.label}`)}
                              title={copyFor(language, `Configure ${chip.label} safety threshold`, `Configurer le seuil d’alerte pour ${chip.label}`, `تخصيص عتبة التنبيه لـ ${chip.label}`)}
                              className="opacity-40 group-hover:opacity-100 hover:text-foreground text-muted-foreground transition-opacity p-0.5 rounded hover:bg-muted/60"
                            >
                              <SlidersHorizontal className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-baseline justify-between gap-1 mt-0.5">
                          <motion.strong
                            key={`val-${chip.value}-${dataVersion}`}
                            animate={isPulsing ? { scale: [1, 1.1, 1], color: threshold.isExceeded ? ['#f59e0b', 'inherit'] : ['#10b981', 'inherit'] } : {}}
                            transition={{ duration: 0.45, delay: i * 0.07 }}
                            className="font-mono text-xs font-semibold"
                          >
                            {chip.value}
                          </motion.strong>
                          {threshold.isExceeded && (
                            <span className="text-[9px] text-muted-foreground/80 flex items-center gap-0.5" title={threshold.tooltip}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* 3-day forecast row with threshold indicators */}
              {forecast && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  {forecast.daily.slice(1, 4).map((d, i) => {
                    const hasForecastAlert =
                      d.tempMin <= 2 || d.tempMax >= 35 || d.precipitationSum >= 15 || d.precipitationProbability >= 80;
                    return (
                      <motion.div
                        key={`fc-${i}-${dataVersion}`}
                        initial={{ opacity: 0.75, y: 3 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: isPulsing ? [1, 1.03, 1] : 1,
                        }}
                        transition={{ duration: 0.4, delay: 0.08 + i * 0.05 }}
                        className={`text-center p-2 rounded-lg transition-colors border ${
                          hasForecastAlert
                            ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
                            : 'border-transparent bg-muted/20 dark:bg-muted/10 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                          <span>{formatWeatherDate(d.date, language, { weekday: 'short' })}</span>
                          {hasForecastAlert && (
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-500" aria-label={copyFor(language, 'Safety alert on this day', 'Alerte météo pour ce jour', 'تنبيه طقس في هذا اليوم')} />
                          )}
                        </div>
                        <motion.div
                          animate={isPulsing ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.5, delay: 0.12 + i * 0.05 }}
                          className="text-xl my-0.5 select-none"
                        >
                          {wmoDescription(d.weatherCode).icon}
                        </motion.div>
                        <div className="text-[10px] font-mono">
                          <span className={`font-semibold ${d.tempMax >= 35 ? 'text-rose-600 dark:text-rose-400' : ''}`}>{d.tempMax.toFixed(0)}°</span>
                          <span className={`text-muted-foreground ${d.tempMin <= 2 ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}>/{d.tempMin.toFixed(0)}°</span>
                        </div>
                        <motion.div
                          animate={isPulsing ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.5, delay: 0.16 + i * 0.05 }}
                          className={`text-[9px] font-mono mt-0.5 px-1.5 py-0.5 rounded inline-block font-medium ${
                            d.precipitationSum >= 15
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                          }`}
                        >
                          {d.precipitationProbability}% · {d.et0.toFixed(1)}mm ET₀
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ET₀ today — 1 col */}
        <div className="rounded-xl border bg-gradient-to-br from-cyan-50/60 to-sky-50/40 dark:from-cyan-950/20 dark:to-sky-950/10 p-4 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
              <Droplets className="h-3 w-3" /> {copyForLevel(language, level, { en: 'Today\'s Water Need', fr: 'Besoin en eau du jour', ar: 'احتياج المياه اليوم' }, { en: 'Today\'s Water Demand', fr: 'Demande en eau du jour', ar: 'الطلب المائي اليوم' }, { en: 'Today\'s ET₀ Signal', fr: 'Signal ET₀ du jour', ar: 'مؤشر ET₀ اليوم' })}
            </div>
            {today && (
              <div className="flex items-center gap-1.5 shrink-0">
                {today.et0 >= thresholds.et0Warning && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                    title={copyFor(language, `High evaporative demand (ET₀ ≥ ${thresholds.et0Warning.toFixed(1)} mm/day)`, `Forte demande évaporative (ET₀ ≥ ${thresholds.et0Warning.toFixed(1)} mm/j)`, `طلب تبخري عالي (ET₀ ≥ ${thresholds.et0Warning.toFixed(1)} مم/يوم)`)}
                  >
                    {copyFor(language, 'High Demand', 'Forte Demande', 'طلب مرتفع')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => openThresholdsFor('rain')}
                  aria-label={copyFor(language, 'Configure ET₀ threshold', 'Configurer le seuil ET₀', 'تخصيص عتبة التبخر ET₀')}
                  title={copyFor(language, 'Configure ET₀ alert threshold', 'Configurer le seuil d’alerte ET₀', 'تخصيص عتبة تنبيه التبخر ET₀')}
                  className="opacity-70 hover:opacity-100 text-cyan-700 dark:text-cyan-300 p-0.5 rounded hover:bg-cyan-500/10 transition-opacity"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                </button>
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  FAO-56
                </motion.span>
              </div>
            )}
          </div>
          {today ? (
            <>
              <motion.div
                key={`et0-val-${today.et0.toFixed(1)}-${dataVersion}`}
                initial={{ scale: 0.96, opacity: 0.8 }}
                animate={{
                  scale: isPulsing ? [1, 1.08, 1] : 1,
                  opacity: 1,
                }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold text-cyan-700 dark:text-cyan-300 leading-tight flex items-baseline gap-1"
              >
                <span>{today.et0.toFixed(1)}</span>
                <span className="text-sm font-normal text-muted-foreground">mm</span>
              </motion.div>
              <div className="text-[10px] text-muted-foreground mt-1">{copyFor(language, 'Reference ET₀ (FAO-56)', 'ET₀ de référence (FAO-56)', 'التبخّر المرجعي ET₀ (FAO-56)')}</div>
              <div className="mt-auto pt-3 space-y-1.5">
                <motion.div
                  key={`rain-metric-${today.precipitationSum.toFixed(1)}-${dataVersion}`}
                  animate={isPulsing ? { scale: [1, 1.03, 1], backgroundColor: ['rgba(6,182,212,0.15)', 'rgba(255,255,255,0.6)'] } : {}}
                  transition={{ duration: 0.5, delay: 0.08 }}
                  className="flex items-center justify-between text-[10px] px-2.5 py-1.5 rounded-md bg-white/70 dark:bg-black/25 border border-cyan-100 dark:border-cyan-900/40"
                >
                  <span className="text-muted-foreground">{copyFor(language, 'Rain today', 'Pluie aujourd’hui', 'المطر اليوم')}</span>
                  <span className="font-mono font-semibold">{today.precipitationSum.toFixed(1)} mm</span>
                </motion.div>
                <motion.div
                  key={`net-irr-${dataVersion}`}
                  animate={isPulsing ? { scale: [1, 1.03, 1], backgroundColor: ['rgba(16,185,129,0.15)', 'rgba(255,255,255,0.6)'] } : {}}
                  transition={{ duration: 0.5, delay: 0.14 }}
                  className="flex items-center justify-between text-[10px] px-2.5 py-1.5 rounded-md bg-white/70 dark:bg-black/25 border border-cyan-100 dark:border-cyan-900/40"
                >
                  <span className="text-muted-foreground">{copyForLevel(language, level, { en: 'Net irrigation', fr: 'Irrigation nette', ar: 'الري الصافي' }, { en: 'Net water demand', fr: 'Demande nette en eau', ar: 'الطلب المائي الصافي' }, { en: 'Net irrigation signal', fr: 'Signal d’irrigation nette', ar: 'مؤشر الري الصافي' })}</span>
                  <span className={`font-mono font-semibold ${Math.max(0, today.et0 - today.precipitationSum * 0.8) > 1 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {Math.max(0, today.et0 - today.precipitationSum * 0.8).toFixed(1)} mm
                  </span>
                </motion.div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenTool('farm', 'collapse_et_tracker')}
                  className="w-full text-[10px] h-7 mt-2 gap-1"
                >
                  {copyForLevel(language, level, { en: 'Open ET Tracker', fr: 'Ouvrir le suivi de l’ET₀', ar: 'افتح متعقّب التبدّر' }, { en: 'Open water operations', fr: 'Ouvrir les opérations hydriques', ar: 'افتح عمليات المياه' }, { en: 'Inspect ET₀ signal', fr: 'Inspecter le signal ET₀', ar: 'افحص مؤشر ET₀' })} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <Skeleton className="h-20 w-full" />
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 7-Day Soil Moisture & ET₀ Trend Analysis (Open-Meteo) */}
      {/* =================================================================== */}
      <section>
        <SoilMoistureTrendChart
          lat={profile.location?.lat ?? 36.75}
          lng={profile.location?.lng ?? 3.05}
          language={language}
          level={level}
          onNavigate={(tab) => onNavigate(tab as TabId)}
        />
      </section>

      {/* =================================================================== */}
      {/* Quick actions */}
      {/* =================================================================== */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{copyForLevel(language, level, { en: 'Quick Actions', fr: 'Actions rapides', ar: 'إجراءات سريعة' }, { en: 'Operations Shortcuts', fr: 'Raccourcis opérationnels', ar: 'اختصارات العمليات' }, { en: 'Analysis Actions', fr: 'Actions d’analyse', ar: 'إجراءات التحليل' })}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction
            icon={Sprout}
            color="#16a34a"
            label={copyFor(language, 'Fertilization plan', 'Plan de fertilisation', 'خطة التسميد')}
            desc={copyFor(language, '20 crops · NPK schedule', '20 cultures · programme NPK', '20 محصول · جدول NPK')}
            onClick={() => { recordToolUse('fertilization'); onOpenTool('farm', 'collapse_fertilization'); }}
          />
          <QuickAction
            icon={Clock}
            color="#0ea5e9"
            label={copyFor(language, 'Irrigation schedule', 'Programme d’irrigation', 'جدول الري')}
            desc={copyFor(language, 'Controllers · YAML export', 'Contrôleurs · export YAML', 'متحكّمات · تصدير YAML')}
            onClick={() => { recordToolUse('irrigation-scheduler'); onOpenTool('farm', 'collapse_irr_sched'); }}
          />
          <QuickAction
            icon={Sparkles}
            color="#6366f1"
            label={copyFor(language, 'Ask AI specialist', 'Demander à un spécialiste IA', 'اسأل وكيل ذكاء')}
            desc={copyFor(language, '10 agents · Crop Scout, etc.', '10 agents · prospection des cultures, etc.', '10 وكلاء · كشف المحاصيل...')}
            onClick={() => { recordToolUse('ai-specialists'); onOpenTool('insights', 'collapse_agent_chat'); }}
          />
          <QuickAction
            icon={MapPin}
            color="#10b981"
            label={copyFor(language, 'Import field', 'Importer une parcelle', 'استيراد حقل')}
            desc={copyFor(language, 'GeoJSON · KML · CSV', 'GeoJSON · KML · CSV', 'GeoJSON · KML · CSV')}
            onClick={() => { recordToolUse('field-boundary'); onOpenTool('farm', 'collapse_boundary'); }}
          />
        </div>
      </section>

      {/* =================================================================== */}
      {/* Today's Tasks + Weather details side-by-side on large screens */}
      {/* =================================================================== */}
      <section className={`grid grid-cols-1 gap-3 ${profile.setupCompleted ? 'lg:grid-cols-2' : ''}`}>
        <TodayTasks level={level} onOpenTool={onOpenTool} refreshToken={refreshToken} />

        {profile.setupCompleted && (
          /* Farm profile summary / edit */
          <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Sprout className="h-3 w-3" /> {copyForLevel(language, level, { en: 'Farm Profile', fr: 'Profil de la ferme', ar: 'ملف المزرعة' }, { en: 'Operating Profile', fr: 'Profil opérationnel', ar: 'ملف التشغيل' }, { en: 'Site Context', fr: 'Contexte du site', ar: 'سياق الموقع' })}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setWizardOpen(true)}
              className="text-[10px] h-6 gap-1"
            >
              {profile.name ? copyFor(language, 'Edit', 'Modifier', 'تعديل') : copyFor(language, 'Set up', 'Configurer', 'إعداد')}
            </Button>
          </div>
          {profile.name || profile.crop ? (
            <div className="space-y-1.5 text-xs">
              {profile.name && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">{copyForLevel(language, level, { en: 'Farm:', fr: 'Ferme :', ar: 'المزرعة:' }, { en: 'Farm:', fr: 'Ferme :', ar: 'المزرعة:' }, { en: 'Site:', fr: 'Site :', ar: 'الموقع:' })}</span>
                  <strong>{profile.name}</strong>
                </div>
              )}
              {profile.crop && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">{copyForLevel(language, level, { en: 'Crop:', fr: 'Culture :', ar: 'المحصول:' }, { en: 'Crop:', fr: 'Culture :', ar: 'المحصول:' }, { en: 'Crop:', fr: 'Culture :', ar: 'المحصول:' })}</span>
                  <strong>{CROP_LIFECYCLES.find(c => c.id === profile.crop)?.emoji} {localizedCropName(language, profile.crop, CROP_LIFECYCLES.find(c => c.id === profile.crop)?.name ?? profile.crop)}</strong>
                </div>
              )}
              {profile.plantingDate && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">{copyForLevel(language, level, { en: 'Planted:', fr: 'Planté :', ar: 'الزراعة:' }, { en: 'Season:', fr: 'Campagne :', ar: 'الموسم:' }, { en: 'Season:', fr: 'Campagne :', ar: 'الموسم:' })}</span>
                  <strong className="font-mono">{profile.plantingDate}</strong>
                </div>
              )}
              {profile.area !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">{copyFor(language, 'Area:', 'Surface :', 'المساحة:')}</span>
                  <strong>{profile.area} ha</strong>
                </div>
              )}
              {profile.lat && profile.lng && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">{copyFor(language, 'Location:', 'Localisation :', 'الموقع:')}</span>
                  <strong className="font-mono text-[10px]">{profile.lat}, {profile.lng}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Sprout className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-2">{copyForLevel(language, level, { en: 'No farm profile yet.', fr: 'Aucun profil de ferme pour le moment.', ar: 'لا يوجد ملف مزرعة بعد.' }, { en: 'No operating profile yet.', fr: 'Aucun profil opérationnel pour le moment.', ar: 'لا يوجد ملف تشغيل بعد.' }, { en: 'No site context yet.', fr: 'Aucun contexte de site pour le moment.', ar: 'لا يوجد سياق للموقع بعد.' })}</p>
              <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> {copyForLevel(language, level, { en: 'Set up your farm', fr: 'Configurer votre ferme', ar: 'أعدّ مزرعتك' }, { en: 'Set up operations', fr: 'Configurer les opérations', ar: 'أعدّ العمليات' }, { en: 'Set up site context', fr: 'Configurer le contexte du site', ar: 'أعدّ سياق الموقع' })}
              </Button>
            </div>
          )}
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* Recent tools */}
      {/* =================================================================== */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Clock className="h-3 w-3" /> {copyFor(language, 'Recently Used', 'Utilisés récemment', 'المستخدمة مؤخراً')}
            </div>
            <Button size="sm" variant="ghost" onClick={onOpenSearch} className="text-[10px] h-6 gap-1">
              <Sparkles className="h-3 w-3" /> {copyFor(language, 'Browse all (⌘K)', 'Tout parcourir (⌘K)', 'تصفّح الكل (⌘K)')}
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.map(tool => {
              const Icon = tool.icon;
              const localizedTool = localizeToolEntry(tool, language);
              return (
                <button
                  key={tool.id}
                  onClick={() => { recordToolUse(tool.id); onOpenTool(tool.tab, tool.storageKey); }}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                  style={{ borderLeftWidth: 3, borderLeftColor: tool.color }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tool.color + '20' }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: tool.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium leading-tight truncate max-w-[140px]">{localizedTool.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{localizedTool.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Pinned tools — shared with the global command palette */}
      {pinned.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Pin className="h-3 w-3 fill-amber-400 text-amber-500" />
            {copyFor(language, 'My pinned tools', 'Mes outils épinglés', 'أدواتي المثبّتة')}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pinned.map(tool => {
              const Icon = tool.icon;
              const localizedTool = localizeToolEntry(tool, language);
              return (
                <button
                  key={tool.id}
                  onClick={() => { recordToolUse(tool.id); onOpenTool(tool.tab, tool.storageKey); }}
                  className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-muted/50"
                  style={{ borderLeftWidth: 3, borderLeftColor: tool.color }}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: tool.color + '20' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: tool.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="max-w-[160px] truncate text-xs font-medium leading-tight">{localizedTool.title}</div>
                    <div className="max-w-[160px] truncate text-[10px] text-muted-foreground">{localizedTool.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* Quick navigation cards (original, preserved) */}
      {/* =================================================================== */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{copyFor(language, 'Browse by Category', 'Parcourir par catégorie', 'تصفّح حسب الفئة')}</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <NavCard icon={Tractor} label={t.tabFarm} desc={copyFor(language, 'Fields, crops, soil, livestock, irrigation', 'Parcelles, cultures, sols, élevage, irrigation', 'الحقول، المحاصيل، التربة، الماشية، الري')} color="#16a34a" onClick={() => onNavigate('farm')} />
          <NavCard icon={Sparkles} label={t.tabInsights} desc={copyFor(language, 'NDVI, weather, AI, financial, community', 'NDVI, météo, IA, finances, communauté', 'NDVI، الطقس، الذكاء، المالية، المجتمع')} color="#6366f1" onClick={() => onNavigate('insights')} />
          <NavCard icon={Wrench} label={t.tabTools} desc={copyFor(language, `${FREE_TOOL_COUNT} free agronomic calculators`, `${FREE_TOOL_COUNT} calculateurs agronomiques gratuits`, `${FREE_TOOL_COUNT} حاسبات زراعية مجانية`)} color="#0891b2" onClick={() => onNavigate('tools')} />
          <NavCard icon={BookOpen} label={t.tabFormulas} desc={copyFor(language, `${FORMULA_COUNT} formulas with calculators`, `${FORMULA_COUNT} formules avec calculateurs`, `${FORMULA_COUNT} معادلة بحاسبات`)} color="#f59e0b" onClick={() => onNavigate('formulas')} />
        </div>
      </section>

      {/* Farm Profile Wizard — auto-opens on first visit, re-openable via Edit button */}
      <FarmProfileWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSaved={() => {
          // Reload the profile from localStorage
          try {
            const saved = localStorage.getItem(FARM_PROFILE_KEY);
            if (saved) setProfile(JSON.parse(saved));
          } catch { /* ignore */ }
          setRefreshToken(value => value + 1);
          void fetchWeather();
        }}
      />

      {/* Telemetry Thresholds Configuration Dialog */}
      <TelemetryThresholdsDialog
        open={thresholdsDialogOpen}
        onOpenChange={setThresholdsDialogOpen}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
        current={current}
        today={today}
        language={language}
        initialTab={thresholdsDialogTab}
      />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function WeatherSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

function TodayFocusPanel({
  level,
  profile,
  forecast,
  weatherLoading,
  weatherError,
  dataVersion = 0,
  isPulsing = false,
  onSetup,
  onOpenTool,
  onRefresh,
}: {
  level: UserLevel;
  profile: FarmProfile;
  forecast: ForecastResult | null;
  weatherLoading: boolean;
  weatherError: string | null;
  dataVersion?: number;
  isPulsing?: boolean;
  onSetup: () => void;
  onOpenTool: HomeDashboardProps['onOpenTool'];
  onRefresh: () => void;
}) {
  const { language } = useTranslation();
  const today = forecast?.daily[0];
  const current = forecast?.current;
  const setupChecks = [profile.name, profile.lat && profile.lng, profile.crop, profile.plantingDate];
  const completedSteps = setupChecks.filter(Boolean).length;

  if (completedSteps < setupChecks.length) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:to-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {copyFor(language, 'Your next best action', 'Votre prochaine action', 'خطوتك التالية')}
              </span>
              <Badge variant="outline" className="text-[9px]">{completedSteps}/4</Badge>
            </div>
            <h3 className="mt-1 text-sm font-semibold">{copyForLevel(language, level,
              { en: 'Finish your farm profile', fr: 'Terminez le profil de votre ferme', ar: 'أكمل ملف مزرعتك' },
              { en: 'Complete your operating profile', fr: 'Complétez votre profil opérationnel', ar: 'أكمل ملف التشغيل' },
              { en: 'Complete your analysis context', fr: 'Complétez votre contexte d’analyse', ar: 'أكمل سياق التحليل' },
            )}</h3>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {copyForLevel(language, level,
                { en: 'Add your location, crop, and planting date so Formula Atlas can turn weather and calculations into a daily plan.', fr: 'Ajoutez votre localisation, votre culture et votre date de plantation pour transformer la météo et les calculs en plan quotidien.', ar: 'أضف موقعك ومحصولك وتاريخ الزراعة لنحوّل الطقس والحسابات إلى خطة يومية قابلة للتنفيذ.' },
                { en: 'Add the farm location, primary crop, and season date so the operating dashboard can prioritize field work.', fr: 'Ajoutez la localisation, la culture principale et la date de campagne pour prioriser les travaux de l’exploitation.', ar: 'أضف موقع المزرعة والمحصول الرئيسي وتاريخ الموسم ليحدد لوحة التشغيل أولويات العمل الميداني.' },
                { en: 'Add the site location, crop context, and season date so evidence and recommendations are interpreted correctly.', fr: 'Ajoutez la localisation, le contexte cultural et la date de campagne pour interpréter correctement les données et recommandations.', ar: 'أضف موقع الحقل وسياق المحصول وتاريخ الموسم لتفسير الأدلة والتوصيات بشكل صحيح.' },
              )}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: copyForLevel(language, level, { en: 'Farm name', fr: 'Nom de la ferme', ar: 'اسم المزرعة' }, { en: 'Farm identity', fr: 'Identité de la ferme', ar: 'هوية المزرعة' }, { en: 'Site identity', fr: 'Identité du site', ar: 'هوية الموقع' }), done: Boolean(profile.name) },
            { label: copyForLevel(language, level, { en: 'Location', fr: 'Localisation', ar: 'الموقع' }, { en: 'Operating location', fr: 'Localisation opérationnelle', ar: 'موقع التشغيل' }, { en: 'Site location', fr: 'Localisation du site', ar: 'موقع الحقل' }), done: Boolean(profile.lat && profile.lng) },
            { label: copyForLevel(language, level, { en: 'Main crop', fr: 'Culture principale', ar: 'المحصول' }, { en: 'Primary crop', fr: 'Culture principale', ar: 'المحصول الرئيسي' }, { en: 'Crop context', fr: 'Contexte cultural', ar: 'سياق المحصول' }), done: Boolean(profile.crop) },
            { label: copyForLevel(language, level, { en: 'Planting date', fr: 'Date de plantation', ar: 'تاريخ الزراعة' }, { en: 'Season date', fr: 'Date de campagne', ar: 'تاريخ الموسم' }, { en: 'Season date', fr: 'Date de campagne', ar: 'تاريخ الموسم' }), done: Boolean(profile.plantingDate) },
          ].map(step => (
            <div key={step.label} className="flex items-center gap-1.5 rounded-md border bg-background/70 px-2 py-1.5 text-[10px]">
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${step.done ? 'text-emerald-600' : 'text-muted-foreground/30'}`} />
              <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onSetup} className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700">
            <Sprout className="h-3.5 w-3.5" /> {copyForLevel(language, level, { en: 'Continue setup', fr: 'Continuer la configuration', ar: 'إكمال الإعداد' }, { en: 'Complete setup', fr: 'Terminer la configuration', ar: 'أكمل الإعداد' }, { en: 'Complete context', fr: 'Compléter le contexte', ar: 'أكمل السياق' })}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onOpenTool('tools')} className="h-8 text-xs">
            {copyFor(language, 'Explore tools', 'Explorer les outils', 'استكشف الأدوات')}
          </Button>
        </div>
      </section>
    );
  }

  if (weatherLoading) {
    return (
      <section className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (weatherError || !today || !current) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {copyFor(language, 'Your next best action', 'Votre prochaine action', 'خطوتك التالية')}
            </span>
            <h3 className="mt-1 text-sm font-semibold">{copyForLevel(language, level,
              { en: 'Update your local conditions', fr: 'Mettez à jour vos conditions locales', ar: 'حدّث ظروف الطقس المحلية' },
              { en: 'Update operating conditions', fr: 'Mettez à jour les conditions opérationnelles', ar: 'حدّث ظروف التشغيل' },
              { en: 'Update site conditions', fr: 'Mettez à jour les conditions du site', ar: 'حدّث ظروف الموقع' },
            )}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {weatherError
                ? copyFor(language, 'Weather could not be loaded right now. Retry or continue using the tools.', 'La météo ne peut pas être chargée pour le moment. Réessayez ou continuez à utiliser les outils.', 'تعذر تحميل الطقس الآن. يمكنك إعادة المحاولة أو متابعة استخدام الأدوات.')
                : copyForLevel(language, level,
                  { en: 'We use your farm location to show ET₀, alerts, and daily recommendations.', fr: 'Nous utilisons la localisation de votre ferme pour afficher l’ET₀, les alertes et les recommandations quotidiennes.', ar: 'سنستخدم موقع مزرعتك لإظهار ET₀ والتنبيهات والتوصيات اليومية.' },
                  { en: 'Set an operating location to connect weather, ET₀, and field priorities to the farm plan.', fr: 'Définissez une localisation opérationnelle pour relier météo, ET₀ et priorités de parcelle au plan de ferme.', ar: 'حدد موقع التشغيل لربط الطقس وET₀ وأولويات الحقول بخطة المزرعة.' },
                  { en: 'Set a site location to interpret weather, ET₀, alerts, and evidence in the right field context.', fr: 'Définissez la localisation du site pour interpréter météo, ET₀, alertes et données dans le bon contexte.', ar: 'حدد موقع الحقل لتفسير الطقس وET₀ والتنبيهات والأدلة في سياق الحقل الصحيح.' },
                )}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onRefresh} className="h-8 shrink-0 text-xs">
            {copyFor(language, 'Retry', 'Réessayer', 'إعادة المحاولة')}
          </Button>
        </div>
      </section>
    );
  }

  let title = copyForLevel(language, level,
    { en: 'Review today\'s crop plan', fr: 'Vérifiez le plan de culture du jour', ar: 'راجع خطة محصولك اليوم' },
    { en: 'Review today\'s operating plan', fr: 'Vérifiez le plan opérationnel du jour', ar: 'راجع خطة التشغيل اليوم' },
    { en: 'Review today\'s field signals', fr: 'Vérifiez les signaux de parcelle du jour', ar: 'راجع مؤشرات الحقل اليوم' },
  );
  let description = copyForLevel(language, level,
    { en: 'Conditions look manageable. Review scheduled tasks and start with the most important field operation.', fr: 'Les conditions semblent maîtrisables. Consultez les tâches prévues et commencez par l’opération la plus importante.', ar: 'الظروف مستقرة. راجع المهام المجدولة وابدأ بأهم عملية ميدانية.' },
    { en: 'Conditions look manageable. Review the operating schedule and start with the highest-priority field action.', fr: 'Les conditions semblent maîtrisables. Consultez le programme opérationnel et commencez par l’action prioritaire.', ar: 'الظروف مستقرة. راجع برنامج التشغيل وابدأ بأعلى إجراء ميداني أولوية.' },
    { en: 'Conditions look manageable. Review the evidence rail and focus the team on the highest-priority signal.', fr: 'Les conditions semblent maîtrisables. Consultez les données et concentrez l’équipe sur le signal prioritaire.', ar: 'الظروف مستقرة. راجع شريط الأدلة ووجّه الفريق إلى أعلى مؤشر أولوية.' },
  );
  let actionLabel = copyForLevel(language, level,
    { en: 'Open labor calendar', fr: 'Ouvrir le calendrier de main-d’œuvre', ar: 'افتح تقويم العمالة' },
    { en: 'Open labor calendar', fr: 'Ouvrir le calendrier de main-d’œuvre', ar: 'افتح تقويم العمالة' },
    { en: 'Open labor calendar', fr: 'Ouvrir le calendrier de main-d’œuvre', ar: 'افتح تقويم العمالة' },
  );
  let actionTab: TabId = 'calendar';
  let actionKey: string | undefined;
  let Icon = CheckCircle2;
  let color = '#16a34a';

  if (today.precipitationProbability >= 60 || today.precipitationSum >= 10) {
    title = copyForLevel(language, level,
      { en: 'Review irrigation before the rain', fr: 'Vérifiez l’irrigation avant la pluie', ar: 'راجع الري قبل هطول المطر' },
      { en: 'Adjust irrigation before the rain', fr: 'Ajustez l’irrigation avant la pluie', ar: 'عدّل الري قبل هطول المطر' },
      { en: 'Review water operations before the rain', fr: 'Vérifiez les opérations hydriques avant la pluie', ar: 'راجع عمليات المياه قبل هطول المطر' },
    );
    description = copyForLevel(language, level,
      { en: `${today.precipitationProbability}% rain probability today. Adjust the schedule to avoid overwatering and save water.`, fr: `${today.precipitationProbability} % de probabilité de pluie aujourd’hui. Ajustez le programme pour éviter le surplus d’eau et économiser la ressource.`, ar: `احتمال المطر ${today.precipitationProbability}% اليوم. أعدّل الجدول لتجنب الري الزائد وتوفير المياه.` },
      { en: `${today.precipitationProbability}% rain probability today. Adjust the farm schedule to avoid overwatering and protect field operations.`, fr: `${today.precipitationProbability} % de probabilité de pluie aujourd’hui. Ajustez le programme de ferme pour éviter le surplus d’eau et protéger les opérations.`, ar: `احتمال المطر ${today.precipitationProbability}% اليوم. عدّل برنامج المزرعة لتجنب الري الزائد وحماية العمليات.` },
      { en: `${today.precipitationProbability}% rain probability today. Reassess water operations and treatment timing against the field evidence.`, fr: `${today.precipitationProbability} % de probabilité de pluie aujourd’hui. Réévaluez les opérations hydriques et le calendrier des traitements selon les données.`, ar: `احتمال المطر ${today.precipitationProbability}% اليوم. أعد تقييم عمليات المياه وتوقيت المعالجة وفقاً لأدلة الحقل.` },
    );
    actionLabel = copyForLevel(language, level,
      { en: 'Open irrigation schedule', fr: 'Ouvrir le programme d’irrigation', ar: 'افتح جدول الري' },
      { en: 'Open irrigation schedule', fr: 'Ouvrir le programme d’irrigation', ar: 'افتح جدول الري' },
      { en: 'Review irrigation schedule', fr: 'Vérifier le programme d’irrigation', ar: 'راجع جدول الري' },
    );
    actionTab = 'farm';
    actionKey = 'collapse_irr_sched';
    Icon = Droplets;
    color = '#0284c7';
  } else if (today.et0 >= 5) {
    title = copyForLevel(language, level,
      { en: 'Water demand is high today', fr: 'La demande en eau est élevée aujourd’hui', ar: 'الطلب المائي مرتفع اليوم' },
      { en: 'Water demand is high across operations', fr: 'La demande en eau est élevée pour les opérations', ar: 'الطلب المائي مرتفع في العمليات' },
      { en: 'High water-demand signal', fr: 'Signal de forte demande en eau', ar: 'مؤشر طلب مائي مرتفع' },
    );
    description = copyForLevel(language, level,
      { en: `Reference ET₀ is ${today.et0.toFixed(1)} mm. Calculate net crop need and schedule irrigation.`, fr: `L’ET₀ de référence est de ${today.et0.toFixed(1)} mm. Calculez le besoin net de la culture et programmez l’irrigation.`, ar: `قيمة ET₀ هي ${today.et0.toFixed(1)} مم. احسب الاحتياج الصافي وجدول الري للمحصول.` },
      { en: `Reference ET₀ is ${today.et0.toFixed(1)} mm. Review field demand and coordinate irrigation capacity across the farm.`, fr: `L’ET₀ de référence est de ${today.et0.toFixed(1)} mm. Vérifiez la demande des parcelles et coordonnez la capacité d’irrigation.`, ar: `قيمة ET₀ هي ${today.et0.toFixed(1)} مم. راجع طلب الحقول ونسّق قدرة الري عبر المزرعة.` },
      { en: `Reference ET₀ is ${today.et0.toFixed(1)} mm. Interpret the water-demand signal with crop stage and site evidence before scheduling.`, fr: `L’ET₀ de référence est de ${today.et0.toFixed(1)} mm. Interprétez le signal avec le stade cultural et les données du site avant de programmer.`, ar: `قيمة ET₀ هي ${today.et0.toFixed(1)} مم. فسّر مؤشر الطلب مع مرحلة المحصول وأدلة الموقع قبل الجدولة.` },
    );
    actionLabel = copyForLevel(language, level,
      { en: 'Open ET₀ tracker', fr: 'Ouvrir le suivi de l’ET₀', ar: 'افتح متعقّب ET₀' },
      { en: 'Review ET₀ operations', fr: 'Vérifier les opérations ET₀', ar: 'راجع عمليات ET₀' },
      { en: 'Analyze ET₀ signal', fr: 'Analyser le signal ET₀', ar: 'حلّل مؤشر ET₀' },
    );
    actionTab = 'farm';
    actionKey = 'collapse_et_tracker';
    Icon = Droplets;
    color = '#0891b2';
  } else if (today.tempMax >= 35 || current.temperature >= 35) {
    title = copyForLevel(language, level,
      { en: 'Watch for heat stress', fr: 'Surveillez le stress thermique', ar: 'راقب إجهاد الحرارة' },
      { en: 'Flag heat exposure across fields', fr: 'Signalez l’exposition à la chaleur dans les parcelles', ar: 'ارصد التعرض للحرارة عبر الحقول' },
      { en: 'Assess heat-stress risk', fr: 'Évaluez le risque de stress thermique', ar: 'قيّم خطر الإجهاد الحراري' },
    );
    description = copyForLevel(language, level,
      { en: `Temperatures may reach ${today.tempMax.toFixed(0)}°C. Scout the crop and review its water need.`, fr: `Les températures peuvent atteindre ${today.tempMax.toFixed(0)} °C. Inspectez la culture et vérifiez son besoin en eau.`, ar: `ستصل الحرارة إلى ${today.tempMax.toFixed(0)}°م. افحص المحصول وراجع احتياج المياه.` },
      { en: `Temperatures may reach ${today.tempMax.toFixed(0)}°C. Prioritize exposed fields for scouting and water coordination.`, fr: `Les températures peuvent atteindre ${today.tempMax.toFixed(0)} °C. Priorisez les parcelles exposées pour la prospection et la coordination de l’eau.`, ar: `ستصل الحرارة إلى ${today.tempMax.toFixed(0)}°م. أعطِ الأولوية للحقول المعرضة للكشف وتنسيق المياه.` },
      { en: `Temperatures may reach ${today.tempMax.toFixed(0)}°C. Assess crop-stage exposure and review scouting evidence before advising action.`, fr: `Les températures peuvent atteindre ${today.tempMax.toFixed(0)} °C. Évaluez l’exposition selon le stade et vérifiez les données de prospection.`, ar: `ستصل الحرارة إلى ${today.tempMax.toFixed(0)}°م. قيّم التعرض حسب مرحلة المحصول وراجع أدلة الكشف قبل التوصية.` },
    );
    actionLabel = copyForLevel(language, level,
      { en: 'Open field scouting', fr: 'Ouvrir la prospection de terrain', ar: 'افتح كشف الحقل' },
      { en: 'Open field scouting', fr: 'Ouvrir la prospection de terrain', ar: 'افتح كشف الحقل' },
      { en: 'Review scouting evidence', fr: 'Vérifier les données de prospection', ar: 'راجع أدلة الكشف' },
    );
    actionTab = 'farm';
    actionKey = 'collapse_scouting';
    Icon = AlertTriangle;
    color = '#d97706';
  } else if (today.windSpeedMax > 30 || current.windSpeed10m > 30) {
    title = copyForLevel(language, level,
      { en: 'Wind is strong — plan spraying carefully', fr: 'Le vent est fort — planifiez les traitements avec prudence', ar: 'الرياح قوية — خطط للرش بحذر' },
      { en: 'Wind is strong — check the spray window', fr: 'Le vent est fort — vérifiez la fenêtre de traitement', ar: 'الرياح قوية — تحقق من نافذة الرش' },
      { en: 'Wind constraint — assess drift risk', fr: 'Contrainte de vent — évaluez le risque de dérive', ar: 'قيد الرياح — قيّم خطر الانجراف' },
    );
    description = copyForLevel(language, level,
      { en: 'Delay spraying when appropriate and review drift risk before heading to the field.', fr: 'Reportez les traitements si nécessaire et vérifiez le risque de dérive avant de vous rendre au champ.', ar: 'أجّل الرش عند الحاجة وراجع خطر انجراف المبيدات قبل الخروج إلى الحقل.' },
      { en: 'Check the spray window, crew timing, and drift risk before assigning field work.', fr: 'Vérifiez la fenêtre de traitement, l’horaire de l’équipe et le risque de dérive avant d’affecter les travaux.', ar: 'تحقق من نافذة الرش وتوقيت الفريق وخطر الانجراف قبل تعيين العمل الميداني.' },
      { en: 'Review drift constraints and treatment timing before making a recommendation.', fr: 'Vérifiez les contraintes de dérive et le calendrier des traitements avant de formuler une recommandation.', ar: 'راجع قيود الانجراف وتوقيت المعالجة قبل تقديم التوصية.' },
    );
    actionLabel = copyForLevel(language, level,
      { en: 'Open drift assessment', fr: 'Ouvrir l’évaluation de la dérive', ar: 'افتح تقييم الانجراف' },
      { en: 'Check drift assessment', fr: 'Vérifier l’évaluation de la dérive', ar: 'تحقق من تقييم الانجراف' },
      { en: 'Assess drift constraints', fr: 'Évaluer les contraintes de dérive', ar: 'قيّم قيود الانجراف' },
    );
    actionTab = 'farm';
    actionKey = 'collapse_drift';
    Icon = AlertTriangle;
    color = '#ea580c';
  }

  return (
    <section className="rounded-xl border p-4" style={{ borderColor: color + '55', background: `linear-gradient(135deg, ${color}12, transparent)` }}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: color + '20' }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
            {copyFor(language, 'Today\'s focus', 'Priorité du jour', 'خطة اليوم')}
          </span>
          <h3 className="mt-1 text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <motion.div
          key={`focus-et0-${today.et0.toFixed(1)}-${dataVersion}`}
          initial={{ opacity: 0.8, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: isPulsing ? [1, 1.08, 1] : 1,
          }}
          transition={{ duration: 0.4 }}
          className="hidden shrink-0 sm:inline-flex"
        >
          <Badge variant="outline" className="text-[9px] gap-1 items-center font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            ET₀ {today.et0.toFixed(1)} mm
          </Badge>
        </motion.div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onOpenTool(actionTab, actionKey)} className="h-8 gap-1.5 text-xs" style={{ backgroundColor: color }}>
          {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onOpenTool('insights', 'collapse_weather_radar')} className="h-8 text-xs">
          {copyFor(language, 'View weather', 'Voir la météo', 'عرض الطقس')}
        </Button>
      </div>
    </section>
  );
}

function QuickAction({ icon: Icon, color, label, desc, onClick }: {
  icon: typeof Sprout; color: string; label: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border bg-card p-3 hover:shadow-sm transition-all hover:-translate-y-0.5"
      style={{ borderTopWidth: 2, borderTopColor: color }}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center mb-2"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="text-xs font-semibold leading-tight">{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
    </button>
  );
}

function NavCard({ icon: Icon, label, desc, color, onClick }: {
  icon: typeof Tractor; label: string; desc: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border bg-card p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
    </button>
  );
}

function greeting(lang?: 'en' | 'fr' | 'ar'): string {
  const h = new Date().getHours();
  if (lang === 'ar') {
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء الخير';
  }
  if (lang === 'fr') {
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
