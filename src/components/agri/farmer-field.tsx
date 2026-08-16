'use client';

/**
 * FarmerField — a focused single-field dashboard that replaces the
 * overwhelming 73-tool Farm tab for Farmer-level users.
 *
 * Instead of collapsed sections, the farmer sees their field at a glance:
 *   1. Weather + irrigation recommendation (one number)
 *   2. Current crop stage + what to do this week
 *   3. Today's tasks (irrigation, fertilization, scouting)
 *   4. Recent field records (last 5 activities)
 *   5. Quick actions (record work, check a problem, see my money)
 *
 * All data is reused from existing stores — no new data models.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Droplets, Calendar, Sprout, CheckCircle2, Cloud, RefreshCw, MapPin,
  TrendingUp, ArrowRight, Clock, FileText, Camera, DollarSign,
  AlertTriangle, Sun, CloudRain, Thermometer, Wind,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TodayTasks } from '@/components/agri/today-tasks';
import { FarmStats } from '@/components/agri/farm-stats';
import { WeatherAlertBanner } from '@/components/agri/weather-alert-banner';
import { getForecast, wmoDescription, type ForecastResult } from '@/lib/open-meteo';
import { CROP_LIFECYCLES, stageForDay } from '@/lib/crop-lifecycle';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';

const FARM_PROFILE_KEY = 'farm_profile_v1';
const LAST_LOC_KEY = 'et_tracker_last_loc_v1';

interface FarmProfile {
  name?: string;
  crop?: string;
  plantingDate?: string;
  area?: number;
  lat?: string;
  lng?: string;
}

type ExperienceTab = 'home' | 'formulas' | 'tools' | 'farm' | 'simulator' | 'insights' | 'about' | 'myfield' | 'help';

interface FarmerFieldProps {
  onOpenTool: (tab: ExperienceTab, storageKey?: string) => void;
  onNavigate: (tab: ExperienceTab) => void;
}

export function FarmerField({ onOpenTool, onNavigate }: FarmerFieldProps) {
  const { language, isRTL } = useTranslation();
  const [profile, setProfile] = useState<FarmProfile>({});
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  // Load farm profile
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FARM_PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      let lat = 36.75, lng = 3.06; // default: Algiers
      try {
        const saved = localStorage.getItem(LAST_LOC_KEY);
        if (saved) {
          const obj = JSON.parse(saved);
          const la = parseFloat(obj.lat), ln = parseFloat(obj.lng);
          if (Number.isFinite(la) && Number.isFinite(ln)) { lat = la; lng = ln; }
        } else if (profile.lat && profile.lng) {
          lat = parseFloat(profile.lat); lng = parseFloat(profile.lng);
        }
      } catch { /* use default */ }
      const f = await getForecast(lat, lng, { days: 4 });
      setForecast(f);
    } catch (e: any) {
      setWeatherError(e?.message || tr('Weather unavailable', 'الطقس غير متاح', 'Météo indisponible'));
    } finally {
      setWeatherLoading(false);
    }
  }, [profile.lat, profile.lng]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  const today = forecast?.daily[0];
  const current = forecast?.current;
  const weatherInfo = current ? wmoDescription(current.weatherCode) : null;
  const et0 = today?.et0 ?? 0;
  const rainfall = today?.precipitationSum ?? 0;
  const netIrrigation = Math.max(0, et0 - rainfall * 0.8);

  // Compute crop stage
  const cropLifecycle = useMemo(() => {
    if (!profile.crop) return null;
    return CROP_LIFECYCLES.find(c => c.id === profile.crop) ?? null;
  }, [profile.crop]);

  const cropStage = useMemo(() => {
    if (!cropLifecycle || !profile.plantingDate) return null;
    const planting = new Date(profile.plantingDate + 'T00:00:00');
    const dayOfSeason = Math.floor((Date.now() - planting.getTime()) / 86400000) + 1;
    if (dayOfSeason < 1 || dayOfSeason > cropLifecycle.seasonLength) return null;
    return { stage: stageForDay(cropLifecycle, dayOfSeason), dayOfSeason, lifecycle: cropLifecycle };
  }, [cropLifecycle, profile.plantingDate]);

  // Recent field records
  const recentRecords = useMemo(() => {
    try {
      const raw = localStorage.getItem('formula_atlas_field_records_v1');
      if (!raw) return [];
      const records = JSON.parse(raw);
      if (!Array.isArray(records)) return [];
      return records.slice(0, 5);
    } catch { return []; }
  }, []);

  const hasProfile = profile.crop || profile.name;

  // If no farm profile set up
  if (!hasProfile) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <NoProfileSetup onNavigate={onNavigate} tr={tr} />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Field header */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Sprout className="h-5 w-5" /></span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{tr('My Field', 'حقلتي', 'Ma parcelle')}</div>
              <h2 className="text-xl font-bold tracking-tight">{profile.name || tr('My Farm', 'مزرعتي', 'Ma ferme')}</h2>
              {cropLifecycle && (
                <p className="text-xs text-white/75 mt-0.5">
                  {cropLifecycle.emoji} {tr(cropLifecycle.name, cropLifecycle.name, cropLifecycle.name)}
                  {profile.area ? ` · ${profile.area} ha` : ''}
                  {cropStage ? ` · ${tr('Day', 'يوم', 'Jour')} ${cropStage.dayOfSeason}` : ''}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchWeather} disabled={weatherLoading} className="text-white hover:bg-white/10 gap-1.5">
            <RefreshCw className={cn('h-3.5 w-3.5', weatherLoading && 'animate-spin')} />
            {tr('Refresh', 'تحديث', 'Actualiser')}
          </Button>
        </div>
      </div>

      {/* Weather + Irrigation card */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-cyan-600" />
              {tr('Weather Today', 'الطقس اليوم', 'Météo aujourd\'hui')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherLoading && <WeatherSkeleton />}
            {weatherError && (
              <div className="text-xs text-amber-600 flex items-center gap-2 py-4">
                <AlertTriangle className="h-4 w-4" /> {weatherError}
              </div>
            )}
            {current && weatherInfo && today && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{weatherInfo.icon}</div>
                  <div>
                    <div className="text-3xl font-bold">{current.temperature.toFixed(1)}°C</div>
                    <div className="text-xs text-muted-foreground">{weatherInfo.label}</div>
                  </div>
                  <div className="ml-auto grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-cyan-500" /> <span className="text-muted-foreground">{tr('Humidity', 'الرطوبة', 'Humidité')}</span> <strong>{current.relativeHumidity}%</strong></div>
                    <div className="flex items-center gap-1"><Wind className="h-3 w-3 text-slate-400" /> <span className="text-muted-foreground">{tr('Wind', 'الرياح', 'Vent')}</span> <strong>{current.windSpeed10m.toFixed(0)} km/h</strong></div>
                    <div className="flex items-center gap-1"><CloudRain className="h-3 w-3 text-blue-500" /> <span className="text-muted-foreground">{tr('Rain', 'المطر', 'Pluie')}</span> <strong>{rainfall.toFixed(1)} mm</strong></div>
                    <div className="flex items-center gap-1"><Thermometer className="h-3 w-3 text-orange-500" /> <span className="text-muted-foreground">{tr('Hi/Lo', 'ع/من', 'Max/Min')}</span> <strong>{today.tempMax.toFixed(0)}°/{today.tempMin.toFixed(0)}°</strong></div>
                  </div>
                </div>
                {/* Irrigation recommendation — the key number */}
                <div className={`rounded-lg p-4 border-2 ${netIrrigation > 1 ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className={`h-5 w-5 ${netIrrigation > 1 ? 'text-amber-600' : 'text-emerald-600'}`} />
                    <span className="text-sm font-bold">
                      {netIrrigation > 1
                        ? tr('Irrigate today', 'اسقِ اليوم', 'Irriguer aujourd\'hui')
                        : tr('No irrigation needed', 'لا حاجة للري', 'Pas d\'irrigation nécessaire')}
                    </span>
                  </div>
                  {netIrrigation > 1 ? (
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {netIrrigation.toFixed(1)} <span className="text-sm font-normal">mm</span>
                      <span className="text-xs text-muted-foreground ml-2">({tr('ET₀', 'تبخر', 'ET₀')} {et0.toFixed(1)} − {tr('rain', 'مطر', 'pluie')} {rainfall.toFixed(1)})</span>
                    </p>
                  ) : (
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      {tr('Rain covers today\'s water need.', 'المطر يغطي احتياج اليوم المائي.', 'La pluie couvre le besoin en eau d\'aujourd\'hui.')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Crop stage card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-violet-600" />
              {tr('Crop Stage', 'مرحلة المحصول', 'Stade de culture')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cropStage ? (
              <div className="space-y-2">
                <div className="text-3xl mb-1">{cropLifecycle?.emoji}</div>
                <div className="text-sm font-bold">{cropStage.stage?.name || tr('Growing', 'نمو', 'Croissance')}</div>
                <div className="text-xs text-muted-foreground">
                  {tr('Day', 'يوم', 'Jour')} {cropStage.dayOfSeason} / {cropLifecycle?.seasonLength}
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600" style={{ width: `${Math.min(100, (cropStage.dayOfSeason / (cropLifecycle?.seasonLength || 1)) * 100)}%` }} />
                </div>
                {/* Stage-specific advice */}
                {cropStage.stage?.description && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2 mt-2">
                    💡 {cropStage.stage.description}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-2 gap-1.5 text-xs" onClick={() => onOpenTool('myfield', 'collapse_algeria_calendar_myfield')}>
                  <Calendar className="h-3 w-3" /> {tr('See full calendar', 'الجدول الكامل', 'Voir le calendrier')}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Sprout className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{tr('Set your crop and planting date to see stage.', 'حدد محصولك وتاريخ الزراعة لرؤية المرحلة.', 'Définissez votre culture et date de plantation.')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weather alerts */}
      {forecast && <WeatherAlertBanner forecast={forecast} />}

      {/* Today's tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {tr('Today\'s Tasks', 'مهام اليوم', 'Tâches d\'aujourd\'hui')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TodayTasks onOpenTool={onOpenTool} />
        </CardContent>
      </Card>

      {/* Quick actions row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction icon={FileText} color="#047857" label={tr('Record Work', 'سجّل عملاً', 'Enregistrer')} onClick={() => onOpenTool('farm', 'collapse_field_records')} />
        <QuickAction icon={Camera} color="#0891b2" label={tr('Check Problem', 'افحص مشكلة', 'Vérifier')} onClick={() => onOpenTool('farm', 'collapse_ipm_action')} />
        <QuickAction icon={Droplets} color="#0284c7" label={tr('Irrigation', 'الري', 'Irrigation')} onClick={() => onOpenTool('farm', 'collapse_water_budget')} />
        <QuickAction icon={DollarSign} color="#f59e0b" label={tr('My Money', 'مالي', 'Mon argent')} onClick={() => onNavigate('simulator')} />
      </div>

      {/* Farm stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            {tr('Farm at a Glance', 'مزرعتي في لمحة', 'Ma ferme en un coup d\'œil')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FarmStats />
        </CardContent>
      </Card>

      {/* Recent records */}
      {recentRecords.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {tr('Recent Records', 'سجلات حديثة', 'Registres récents')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRecords.map((rec: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                <Badge variant="outline" className="text-[9px] capitalize">{rec.type || rec.category || 'activity'}</Badge>
                <span className="font-medium truncate flex-1">{rec.title || rec.description || rec.note || '—'}</span>
                <span className="text-muted-foreground font-mono text-[10px]">{rec.date ? new Date(rec.date).toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : undefined) : ''}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Browse all tools (escape hatch) */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
        <div>
          <p className="text-sm font-semibold">{tr('Need more tools?', 'تحتاج أدوات أخرى؟', 'Besoin d\'autres outils ?')}</p>
          <p className="text-xs text-muted-foreground">{tr('Browse the full library anytime.', 'تصفح المكتبة الكاملة في أي وقت.', 'Parcourez toute la bibliothèque à tout moment.')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate('farm')} className="gap-1.5">
          {tr('All Tools', 'كل الأدوات', 'Tous les outils')} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
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
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-32 ml-auto" />
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function QuickAction({ icon: Icon, color, label, onClick }: { icon: typeof FileText; color: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg" style={{ background: `${color}18`, color }}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function NoProfileSetup({ onNavigate, tr }: { onNavigate: (tab: ExperienceTab) => void; tr: (en: string, ar: string, fr: string) => string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg mb-4">
        <Sprout className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold mb-2">{tr('Set up your farm to see your field', 'أعدّ ملف مزرعتك لرؤية حقلتك', 'Configurez votre ferme pour voir votre parcelle')}</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        {tr('Tell us your crop, planting date, and location. We\'ll show you today\'s tasks, irrigation needs, and crop stage — automatically.', 'أخبرنا بمحصولك وتاريخ الزراعة وموقعك. سنعرض لك مهام اليوم واحتياجات الري ومرحلة المحصول تلقائياً.', 'Indiquez votre culture, date de plantation et localisation. Nous afficherons les tâches, l\'irrigation et le stade automatiquement.')}
      </p>
      <Button onClick={() => onNavigate('home')} className="gap-1.5">
        <Sprout className="h-4 w-4" /> {tr('Set up my farm', 'أعدّ مزرعتي', 'Configurer ma ferme')}
      </Button>
    </div>
  );
}

import { cn } from '@/lib/utils';
