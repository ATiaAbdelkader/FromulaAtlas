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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cloud, Sun, Droplets, MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  Sprout, Clock, Sparkles, Tractor, BookOpen, Wrench, Pin,
  ArrowRight, Zap, Calendar,
} from 'lucide-react';
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
import { FarmProfileWizard, needsFarmProfileSetup } from '@/components/agri/farm-profile-wizard';
import { useTranslation, type Language } from '@/lib/language-store';
import { FREE_TOOL_COUNT, FORMULA_COUNT } from '@/lib/catalog-stats';
import { localizeToolEntry } from '@/lib/tool-registry';

const FARM_PROFILE_KEY = 'farm_profile_v1';
const LAST_LOC_KEY = 'et_tracker_last_loc_v1';

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
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
}

interface HomeDashboardProps {
  /** Navigate to a tab. */
  onNavigate: (tab: 'home' | 'formulas' | 'tools' | 'farm' | 'insights') => void;
  /** Open a specific tool by storageKey. */
  onOpenTool: (tab: 'home' | 'formulas' | 'tools' | 'farm' | 'insights', storageKey?: string) => void;
  /** Open the command palette. */
  onOpenSearch: () => void;
}

export function HomeDashboard({ onNavigate, onOpenTool, onOpenSearch }: HomeDashboardProps) {
  const [profile, setProfile] = useState<FarmProfile>({});
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [recent, setRecent] = useState<ToolEntry[]>([]);
  const [pinned, setPinned] = useState<ToolEntry[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const { t, language } = useTranslation();

  // Load farm profile + recent tools from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FARM_PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch { /* ignore */ }
    setRecent(getRecentTools());
    setPinned(getPinnedTools());
    const syncPinned = () => setPinned(getPinnedTools());
    window.addEventListener(TOOL_PINS_CHANGED_EVENT, syncPinned);
    // Auto-open the wizard on first visit (when no profile exists)
    if (needsFarmProfileSetup()) {
      setTimeout(() => setWizardOpen(true), 1500);  // slight delay so the dashboard renders first
    }
    return () => window.removeEventListener(TOOL_PINS_CHANGED_EVENT, syncPinned);
  }, []);

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
      setRecent(getRecentTools());
      setPinned(getPinnedTools());
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
              {greeting(language)}, {language === 'ar' ? 'أيها المزارع' : language === 'fr' ? 'agriculteur' : 'farmer'} 👋
            </h2>
            <p className="text-emerald-100 text-xs mt-1">
              {today
                ? copyFor(language, `Today's ET₀ is ${today.et0.toFixed(1)} mm · ${wmoDescription(today.weatherCode).label.toLowerCase()}`, `L’ET₀ du jour est de ${today.et0.toFixed(1)} mm · ${wmoDescription(today.weatherCode).label.toLowerCase()}`, `التبدّر المرجعي اليوم ${today.et0.toFixed(1)} مم · ${wmoDescription(today.weatherCode).label}`)
                : copyFor(language, 'Loading today\'s conditions…', 'Chargement des conditions du jour…', 'جارٍ تحميل ظروف اليوم…')}
            </p>
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
        profile={profile}
        forecast={forecast}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        onSetup={() => setWizardOpen(true)}
        onOpenTool={onOpenTool}
        onRefresh={fetchWeather}
      />

      {/* Farm stats — aggregate counts */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{copyFor(language, 'Your Farm at a Glance', 'Votre ferme en un coup d’œil', 'مزرعتك في لمحة')}</div>
        <FarmStats />
      </section>

      {/* =================================================================== */}
      {/* Weather + ET₀ widget */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Current weather — spans 2 cols on lg */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <MapPin className="h-3 w-3" /> {copyFor(language, 'Current Weather', 'Météo actuelle', 'الطقس الحالي')}
            </div>
            <Button size="sm" variant="ghost" onClick={fetchWeather} disabled={weatherLoading} className="h-6 w-6 p-0">
              <RefreshCw className={`h-3 w-3 ${weatherLoading ? 'animate-spin' : ''}`} />
            </Button>
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
                {copyFor(language, 'Complete your farm profile to see local weather.', 'Complétez le profil de votre ferme pour voir la météo locale.', 'أكمل ملف مزرعتك لرؤية الطقس المحلي.')}
              </p>
              <Button size="sm" variant="outline" onClick={() => setWizardOpen(true)} className="h-7 text-[10px] gap-1">
                {copyFor(language, 'Set up location', 'Configurer la localisation', 'إعداد الموقع')} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {!weatherLoading && !weatherError && current && today && (
            <div className="space-y-3">
              {/* Current conditions row */}
              <div className="flex items-center gap-4">
                <div className="text-4xl">{wmoDescription(current.weatherCode).icon}</div>
                <div className="flex-1">
                  <div className="text-2xl font-bold">{current.temperature.toFixed(1)}°C</div>
                  <div className="text-xs text-muted-foreground">{wmoDescription(current.weatherCode).label}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">{copyFor(language, 'RH', 'HR', 'الرطوبة')}</span> <strong className="font-mono">{current.relativeHumidity}%</strong></div>
                  <div><span className="text-muted-foreground">{copyFor(language, 'Wind', 'Vent', 'الرياح')}</span> <strong className="font-mono">{current.windSpeed10m.toFixed(1)} km/h</strong></div>
                  <div><span className="text-muted-foreground">{copyFor(language, 'Hi/Lo', 'Max/Min', 'ع/من')}</span> <strong className="font-mono">{today.tempMax.toFixed(0)}°/{today.tempMin.toFixed(0)}°</strong></div>
                  <div><span className="text-muted-foreground">{copyFor(language, 'Rain', 'Pluie', 'المطر')}</span> <strong className="font-mono">{today.precipitationSum.toFixed(1)} mm</strong></div>
                </div>
              </div>

              {/* 3-day forecast row */}
              {forecast && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  {forecast.daily.slice(1, 4).map((d, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {new Date(d.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className="text-xl my-0.5">{wmoDescription(d.weatherCode).icon}</div>
                      <div className="text-[10px] font-mono">
                        <span className="font-semibold">{d.tempMax.toFixed(0)}°</span>
                        <span className="text-muted-foreground">/{d.tempMin.toFixed(0)}°</span>
                      </div>
                      <div className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono">
                        {d.precipitationProbability}% · {d.et0.toFixed(1)}mm ET₀
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ET₀ today — 1 col */}
        <div className="rounded-xl border bg-gradient-to-br from-cyan-50/60 to-sky-50/40 dark:from-cyan-950/20 dark:to-sky-950/10 p-4 flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide mb-2">
            <Droplets className="h-3 w-3" /> {copyFor(language, 'Today\'s Water Need', 'Besoin en eau du jour', 'احتياج المياه اليوم')}
          </div>
          {today ? (
            <>
              <div className="text-4xl font-bold text-cyan-700 dark:text-cyan-300 leading-tight">
                {today.et0.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">mm</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{copyFor(language, 'Reference ET₀ (FAO-56)', 'ET₀ de référence (FAO-56)', 'التبخّر المرجعي ET₀ (FAO-56)')}</div>
              <div className="mt-auto pt-3 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{copyFor(language, 'Rain today', 'Pluie aujourd’hui', 'المطر اليوم')}</span>
                  <span className="font-mono font-semibold">{today.precipitationSum.toFixed(1)} mm</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{copyFor(language, 'Net irrigation', 'Irrigation nette', 'الري الصافي')}</span>
                  <span className={`font-mono font-semibold ${Math.max(0, today.et0 - today.precipitationSum * 0.8) > 1 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {Math.max(0, today.et0 - today.precipitationSum * 0.8).toFixed(1)} mm
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenTool('farm', 'collapse_et_tracker')}
                  className="w-full text-[10px] h-7 mt-2 gap-1"
                >
                  {copyFor(language, 'Open ET Tracker', 'Ouvrir le suivi de l’ET₀', 'افتح متعقّب التبدّر')} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <Skeleton className="h-20 w-full" />
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* Quick actions */}
      {/* =================================================================== */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{copyFor(language, 'Quick Actions', 'Actions rapides', 'إجراءات سريعة')}</div>
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
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TodayTasks onOpenTool={onOpenTool} refreshToken={refreshToken} />

        {/* Farm profile summary / edit */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Sprout className="h-3 w-3" /> {copyFor(language, 'Farm Profile', 'Profil de la ferme', 'ملف المزرعة')}
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
                  <span className="text-muted-foreground w-16">{copyFor(language, 'Farm:', 'Ferme :', 'المزرعة:')}</span>
                  <strong>{profile.name}</strong>
                </div>
              )}
              {profile.crop && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">{copyFor(language, 'Crop:', 'Culture :', 'المحصول:')}</span>
                  <strong>{CROP_LIFECYCLES.find(c => c.id === profile.crop)?.emoji} {CROP_LIFECYCLES.find(c => c.id === profile.crop)?.name}</strong>
                </div>
              )}
              {profile.plantingDate && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">{copyFor(language, 'Planted:', 'Planté :', 'الزراعة:')}</span>
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
              <p className="text-xs text-muted-foreground mb-2">{copyFor(language, 'No farm profile yet.', 'Aucun profil de ferme pour le moment.', 'لا يوجد ملف مزرعة بعد.')}</p>
              <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> {copyFor(language, 'Set up your farm', 'Configurer votre ferme', 'أعدّ مزرعتك')}
              </Button>
            </div>
          )}
        </div>
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
  profile,
  forecast,
  weatherLoading,
  weatherError,
  onSetup,
  onOpenTool,
  onRefresh,
}: {
  profile: FarmProfile;
  forecast: ForecastResult | null;
  weatherLoading: boolean;
  weatherError: string | null;
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
            <h3 className="mt-1 text-sm font-semibold">{copyFor(language, 'Finish your farm profile', 'Terminez le profil de votre ferme', 'أكمل ملف مزرعتك')}</h3>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {copyFor(language, 'Add your location, crop, and planting date so Formula Atlas can turn weather and calculations into a daily plan.', 'Ajoutez votre localisation, votre culture et votre date de plantation pour transformer la météo et les calculs en plan quotidien.', 'أضف موقعك ومحصولك وتاريخ الزراعة لنحوّل الطقس والحسابات إلى خطة يومية قابلة للتنفيذ.')}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: copyFor(language, 'Farm name', 'Nom de la ferme', 'اسم المزرعة'), done: Boolean(profile.name) },
            { label: copyFor(language, 'Location', 'Localisation', 'الموقع'), done: Boolean(profile.lat && profile.lng) },
            { label: copyFor(language, 'Main crop', 'Culture principale', 'المحصول'), done: Boolean(profile.crop) },
            { label: copyFor(language, 'Planting date', 'Date de plantation', 'تاريخ الزراعة'), done: Boolean(profile.plantingDate) },
          ].map(step => (
            <div key={step.label} className="flex items-center gap-1.5 rounded-md border bg-background/70 px-2 py-1.5 text-[10px]">
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${step.done ? 'text-emerald-600' : 'text-muted-foreground/30'}`} />
              <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onSetup} className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700">
            <Sprout className="h-3.5 w-3.5" /> {copyFor(language, 'Continue setup', 'Continuer la configuration', 'إكمال الإعداد')}
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
            <h3 className="mt-1 text-sm font-semibold">{copyFor(language, 'Update your local conditions', 'Mettez à jour vos conditions locales', 'حدّث ظروف الطقس المحلية')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {weatherError
                ? copyFor(language, 'Weather could not be loaded right now. Retry or continue using the tools.', 'La météo ne peut pas être chargée pour le moment. Réessayez ou continuez à utiliser les outils.', 'تعذر تحميل الطقس الآن. يمكنك إعادة المحاولة أو متابعة استخدام الأدوات.')
                : copyFor(language, 'We use your farm location to show ET₀, alerts, and daily recommendations.', 'Nous utilisons la localisation de votre ferme pour afficher l’ET₀, les alertes et les recommandations quotidiennes.', 'سنستخدم موقع مزرعتك لإظهار ET₀ والتنبيهات والتوصيات اليومية.')}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onRefresh} className="h-8 shrink-0 text-xs">
            {copyFor(language, 'Retry', 'Réessayer', 'إعادة المحاولة')}
          </Button>
        </div>
      </section>
    );
  }

  let title = copyFor(language, 'Review today\'s crop plan', 'Vérifiez le plan de culture du jour', 'راجع خطة محصولك اليوم');
  let description = copyFor(language, 'Conditions look manageable. Review scheduled tasks and start with the most important field operation.', 'Les conditions semblent maîtrisables. Consultez les tâches prévues et commencez par l’opération la plus importante.', 'الظروف مستقرة. راجع المهام المجدولة وابدأ بأهم عملية ميدانية.');
  let actionLabel = copyFor(language, 'Open labor calendar', 'Ouvrir le calendrier de main-d’œuvre', 'افتح تقويم العمالة');
  let actionTab: 'farm' | 'insights' = 'farm';
  let actionKey = 'collapse_labor_cal';
  let Icon = CheckCircle2;
  let color = '#16a34a';

  if (today.precipitationProbability >= 60 || today.precipitationSum >= 10) {
    title = copyFor(language, 'Review irrigation before the rain', 'Vérifiez l’irrigation avant la pluie', 'راجع الري قبل هطول المطر');
    description = copyFor(language, `${today.precipitationProbability}% rain probability today. Adjust the schedule to avoid overwatering and save water.`, `${today.precipitationProbability} % de probabilité de pluie aujourd’hui. Ajustez le programme pour éviter le surplus d’eau et économiser la ressource.`, `احتمال المطر ${today.precipitationProbability}% اليوم. أعدّل الجدول لتجنب الري الزائد وتوفير المياه.`);
    actionLabel = copyFor(language, 'Open irrigation schedule', 'Ouvrir le programme d’irrigation', 'افتح جدول الري');
    actionKey = 'collapse_irr_sched';
    Icon = Droplets;
    color = '#0284c7';
  } else if (today.et0 >= 5) {
    title = copyFor(language, 'Water demand is high today', 'La demande en eau est élevée aujourd’hui', 'الطلب المائي مرتفع اليوم');
    description = copyFor(language, `Reference ET₀ is ${today.et0.toFixed(1)} mm. Calculate net crop need and schedule irrigation.`, `L’ET₀ de référence est de ${today.et0.toFixed(1)} mm. Calculez le besoin net de la culture et programmez l’irrigation.`, `قيمة ET₀ هي ${today.et0.toFixed(1)} مم. احسب الاحتياج الصافي وجدول الري للمحصول.`);
    actionLabel = copyFor(language, 'Open ET₀ tracker', 'Ouvrir le suivi de l’ET₀', 'افتح متعقّب ET₀');
    actionKey = 'collapse_et_tracker';
    Icon = Droplets;
    color = '#0891b2';
  } else if (today.tempMax >= 35 || current.temperature >= 35) {
    title = copyFor(language, 'Watch for heat stress', 'Surveillez le stress thermique', 'راقب إجهاد الحرارة');
    description = copyFor(language, `Temperatures may reach ${today.tempMax.toFixed(0)}°C. Scout the crop and review its water need.`, `Les températures peuvent atteindre ${today.tempMax.toFixed(0)} °C. Inspectez la culture et vérifiez son besoin en eau.`, `ستصل الحرارة إلى ${today.tempMax.toFixed(0)}°م. افحص المحصول وراجع احتياج المياه.`);
    actionLabel = copyFor(language, 'Open field scouting', 'Ouvrir la prospection de terrain', 'افتح كشف الحقل');
    actionKey = 'collapse_scouting';
    Icon = AlertTriangle;
    color = '#d97706';
  } else if (today.windSpeedMax > 30 || current.windSpeed10m > 30) {
    title = copyFor(language, 'Wind is strong — plan spraying carefully', 'Le vent est fort — planifiez les traitements avec prudence', 'الرياح قوية — خطط للرش بحذر');
    description = copyFor(language, 'Delay spraying when appropriate and review drift risk before heading to the field.', 'Reportez les traitements si nécessaire et vérifiez le risque de dérive avant de vous rendre au champ.', 'أجّل الرش عند الحاجة وراجع خطر انجراف المبيدات قبل الخروج إلى الحقل.');
    actionLabel = copyFor(language, 'Open drift assessment', 'Ouvrir l’évaluation de la dérive', 'افتح تقييم الانجراف');
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
        <Badge variant="outline" className="hidden shrink-0 text-[9px] sm:inline-flex">ET₀ {today.et0.toFixed(1)} mm</Badge>
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
