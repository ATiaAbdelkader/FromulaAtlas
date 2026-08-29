'use client';

/**
 * FarmerField — a focused, high-contrast, touch-friendly single-field
 * dashboard tailored for Algerian farmers.
 *
 * Features:
 *   1. High-Sunlight Outdoor Mode toggle (Mode Plein Soleil / وضع تحت الشمس)
 *   2. Smart Weather Go/No-Go Advisor + Spoken Daily Audio Briefing (TTS in Arabic & French)
 *   3. Visual Crop Stage & Phenology Tracker with days to harvest
 *   4. One-Tap In-Field Quick Logger (Water, Fertilizer, Spray, Pest, Harvest)
 *   5. Zero-Jargon Field Calculators (Backpack Sprayer, 50kg Bags, Drip Pump Timer)
 *   6. Algerian Wholesale Souk Prices & Harvest Revenue Calculator
 *   7. Photo-First Symptom Checker & Leaf Disease Diagnostic Guide
 *   8. Today's Tasks & Recent Field Book Timeline
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Droplets, Calendar, Sprout, CheckCircle2, Cloud, RefreshCw, MapPin,
  TrendingUp, ArrowRight, Clock, FileText, Camera, DollarSign,
  AlertTriangle, Sun, CloudRain, Thermometer, Wind, WifiOff,
  Sparkles, Eye, ShieldCheck, HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TodayTasks } from '@/components/agri/today-tasks';
import { FarmStats } from '@/components/agri/farm-stats';
import { WeatherAlertBanner } from '@/components/agri/weather-alert-banner';
import { FarmerWeatherAdvisor } from '@/components/agri/farmer-weather-advisor';
import { FarmerQuickLogger } from '@/components/agri/farmer-quick-logger';
import { FarmerCalculators } from '@/components/agri/farmer-calculators';
import { FarmerMarketBenchmarks } from '@/components/agri/farmer-market-benchmarks';
import { FarmerSymptomChecker } from '@/components/agri/farmer-symptom-checker';
import { AgroVisionHub } from '@/components/agri/agro-vision-hub';
import { FarmPilotDecisionCard } from '@/components/agri/farmpilot-decision-card';
import { getForecast, wmoDescription, type ForecastResult } from '@/lib/open-meteo';
import { formatWeatherDate, localizedWeatherLabel } from '@/lib/weather-localization';
import { CROP_LIFECYCLES, stageForDay } from '@/lib/crop-lifecycle';
import { useTranslation, copyFor } from '@/lib/language-store';
import type { TabId } from '@/lib/user-level';
import { cn } from '@/lib/utils';

const FARM_PROFILE_KEY = 'farm_profile_v1';
const LAST_LOC_KEY = 'et_tracker_last_loc_v1';
const SUN_MODE_KEY = 'farmer_sun_mode_v1';

interface FarmProfile {
  name?: string;
  crop?: string;
  plantingDate?: string;
  area?: number;
  lat?: string;
  lng?: string;
}

type ExperienceTab = TabId;

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
  const [sunMode, setSunMode] = useState(false);
  const [recordVersion, setRecordVersion] = useState(0);

  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  // Load farm profile & sun mode preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FARM_PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
      const savedSun = localStorage.getItem(SUN_MODE_KEY);
      if (savedSun) setSunMode(savedSun === 'true');
    } catch { /* ignore */ }
  }, []);

  const toggleSunMode = () => {
    setSunMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SUN_MODE_KEY, String(next));
      } catch { /* ignore */ }
      return next;
    });
  };

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
  const et0 = today?.et0 ?? 0;
  const rainfall = today?.precipitationSum ?? 0;
  // P0-3 fix: Use full water balance — ETc = Kc × ET₀, not just ET₀
  // Net irrigation = ETc − effective rain, Gross = Net / efficiency
  // Kc is computed below from cropStage; here we use a placeholder
  // that gets corrected after cropStage is computed.
  const effectiveRainfall = rainfall * 0.8; // FAO-56: ~80% reaches root zone
  // Note: netIrrigation is the NET need. Gross = Net / efficiency.
  // The FarmerWeatherAdvisor displays netIrrigationMm (ETc-based advisory).

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
    return {
      stage: stageForDay(cropLifecycle, dayOfSeason),
      dayOfSeason,
      lifecycle: cropLifecycle,
      daysRemaining: Math.max(0, cropLifecycle.seasonLength - dayOfSeason),
      percent: Math.min(100, Math.round((dayOfSeason / cropLifecycle.seasonLength) * 100)),
    };
  }, [cropLifecycle, profile.plantingDate]);

  // P0-3: Compute irrigation with actual Kc from crop stage
  const actualKc = cropStage?.stage?.kc ?? 0.5;
  const actualETc = actualKc * et0;
  const actualNetIrrigation = Math.max(0, actualETc - effectiveRainfall);

  // Recent field records (refreshable via recordVersion)
  const recentRecords = useMemo(() => {
    try {
      const raw = localStorage.getItem('formula_atlas_field_records_v1');
      if (!raw) return [];
      const records = JSON.parse(raw);
      if (!Array.isArray(records)) return [];
      return records.slice(0, 6);
    } catch { return []; }
  }, [recordVersion]);

  const hasProfile = profile.crop || profile.name;

  if (!hasProfile) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <NoProfileSetup onNavigate={onNavigate} tr={tr} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 pb-12 ${sunMode ? 'font-medium contrast-125' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Banner: Farm Title + Sun Mode Toggle + Offline Indicator */}
      <div className={`rounded-2xl p-5 shadow-sm transition-all ${
        sunMode
          ? 'bg-slate-950 text-white border-2 border-amber-400 ring-2 ring-amber-400/50'
          : 'bg-gradient-to-br from-emerald-800 via-green-800 to-teal-900 text-white'
      }`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              sunMode ? 'bg-amber-400 text-black font-extrabold' : 'bg-white/15 text-white'
            }`}>
              <Sprout className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                  {tr('My Field', 'حقلتي', 'Ma parcelle')}
                </span>
                <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] py-0 px-1.5 gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-300" />
                  {tr('Offline-Saved', 'محفوظ بدون إنترنت', 'Mode Hors-ligne')}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{profile.name || tr('My Farm', 'مزرعتي', 'Ma ferme')}</h2>
              {cropLifecycle && (
                <p className="text-xs text-white/90 mt-0.5 font-medium">
                  {cropLifecycle.emoji} {tr(cropLifecycle.name, cropLifecycle.name, cropLifecycle.name)}
                  {profile.area ? ` · ${profile.area} ha` : ''}
                  {cropStage ? ` · ${tr('Day', 'يوم', 'Jour')} ${cropStage.dayOfSeason} (${cropStage.daysRemaining} ${tr('days to harvest', 'يوماً حتى الحصاد', 'jours avant récolte')})` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant={sunMode ? 'default' : 'secondary'}
              size="sm"
              onClick={toggleSunMode}
              className={`h-9 px-3 gap-1.5 text-xs font-bold transition-all ${
                sunMode
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>{sunMode ? tr('☀️ Sun Mode ON', '☀️ وضع الشمس مفعل', '☀️ Plein Soleil ON') : tr('☀️ Sun Mode', '☀️ وضع تحت الشمس', '☀️ Plein Soleil')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWeather}
              disabled={weatherLoading}
              className="h-9 px-2.5 text-white hover:bg-white/15"
            >
              <RefreshCw className={cn('h-4 w-4', weatherLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </div>

      {/* 0. FARMPILOT DECISION INTELLIGENCE — irrigation + fertilizer + crop recommendation + provenance */}
      <FarmPilotDecisionCard
        cropId={profile.crop}
        plantingDate={profile.plantingDate}
        areaHa={profile.area || 0.5}
        forecast={forecast}
        isLiveForecast={Boolean(today?.et0)}
        sunMode={sunMode}
        onOpenFarmPilotWizard={() => onNavigate('farmpilot')}
      />

      {/* 1. SMART WEATHER & GO / NO-GO SPRAY ADVISOR (WITH TTS VOICE) */}
      <FarmerWeatherAdvisor
        forecast={forecast}
        cropName={cropLifecycle ? cropLifecycle.name : profile.crop || 'Crop'}
        stageName={cropStage?.stage?.name || 'Active Growth'}
        netIrrigationMm={actualNetIrrigation}
        sunMode={sunMode}
      />

      {/* 2. ONE-TAP IN-FIELD QUICK LOGGER */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {tr('⚡ One-Tap Quick Logging (Direct to Field Book)', '⚡ تسجيل سريع بلمسة واحدة (مباشرة لدفتر الحقل)', '⚡ Saisie rapide au champ (Carnet de parcelle)')}
          </label>
          <span className="text-[11px] text-emerald-600 font-semibold">{tr('Instant Auto-Save', 'حفظ فوري', 'Sauvegarde instantanée')}</span>
        </div>
        <FarmerQuickLogger
          fieldName={profile.name || 'Field 1'}
          cropName={cropLifecycle ? cropLifecycle.name : profile.crop || 'Potato'}
          onRecordAdded={() => setRecordVersion((v) => v + 1)}
          sunMode={sunMode}
        />
      </div>

      {/* 3. CROP STAGE & VISUAL PHENOLOGY TRACKER */}
      {cropStage && (
        <Card className={`border ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-sm font-bold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>{tr('Crop Stage & Growth Progress', 'مرحلة نمو المحصول ومسار النضج', 'Stade de croissance & Phénologie')}</span>
              </div>
              <Badge className="bg-emerald-600 text-white font-mono text-xs">
                {cropStage.percent}% {tr('Completed', 'مكتمل', 'Complété')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cropLifecycle?.emoji}</span>
                <div>
                  <div className="font-bold text-foreground">{cropStage.stage?.name || tr('Vegetative', 'نمو خضري', 'Végétatif')}</div>
                  <div className="text-muted-foreground text-[11px]">
                    {tr('Day', 'اليوم', 'Jour')} {cropStage.dayOfSeason} {tr('of', 'من', 'sur')} {cropLifecycle?.seasonLength}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-700 dark:text-emerald-400">{cropStage.daysRemaining} {tr('days left', 'يوماً متبقياً', 'jours restants')}</div>
                <div className="text-[11px] text-muted-foreground">{tr('Est. Harvest Window', 'توقع موعد الحصاد', 'Récolte estimée')}</div>
              </div>
            </div>

            {/* Custom Multi-Step Visual Phenology Bar */}
            <div className="space-y-1">
              <div className="h-3 rounded-full bg-muted/80 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 transition-all"
                  style={{ width: `${cropStage.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                <span>🌱 {tr('Planting', 'الغرس', 'Semis')}</span>
                <span>🌿 {tr('Vegetative', 'خضري', 'Végétatif')}</span>
                <span>🌸 {tr('Flowering', 'تزهير', 'Floraison')}</span>
                <span>🥔 {tr('Bulking', 'تحجيم', 'Grossissement')}</span>
                <span>🌾 {tr('Harvest', 'حصاد', 'Récolte')}</span>
              </div>
            </div>

            {cropStage.stage?.description && (
              <div className="text-xs text-foreground bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-start gap-2">
                <span className="text-base">💡</span>
                <span className="leading-relaxed">{cropStage.stage.description}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1 gap-1.5 text-xs font-semibold"
              onClick={() => onOpenTool('calendar')}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{tr('See Full Crop Operations Calendar', 'عرض جدول العمليات الزراعية الكامل', 'Voir le calendrier agricole complet')}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 4. PRACTICAL TANGIBLE CALCULATORS (Backpack, 50kg bags, Drip timer) */}
      <FarmerCalculators
        defaultAreaHa={profile.area || 1}
        cropName={cropLifecycle ? cropLifecycle.name : profile.crop || 'Potato'}
        sunMode={sunMode}
      />

      {/* 5. COMPUTER VISION & FIELD LENS STUDIO (CANOPY, PEST TRAP, LESION SEVERITY) */}
      <AgroVisionHub
        initialCrop={cropLifecycle ? cropLifecycle.name : profile.crop || 'Tomato'}
        initialWilaya="Blida / Mitidja"
        sunMode={sunMode}
        onSyncIrrigation={() => onOpenTool('farm', 'collapse_water_budget')}
        onLogToFieldBook={() => onOpenTool('farm', 'collapse_field_records')}
      />

      {/* 6. PHOTO SYMPTOM CHECKER & LEAF HEALTH GUIDE */}
      <FarmerSymptomChecker
        cropName={cropLifecycle ? cropLifecycle.name : profile.crop || 'Potato'}
        onOpenProductFinder={() => onOpenTool('myfield', 'collapse_product_finder_myfield')}
        onOpenHelp={() => onNavigate('help')}
        sunMode={sunMode}
      />

      {/* 7. ALGERIAN WHOLESALE SOUK PRICES & REVENUE BENCHMARKS */}
      <FarmerMarketBenchmarks
        defaultCrop={profile.crop || 'Potato'}
        defaultAreaHa={profile.area || 1}
        sunMode={sunMode}
      />

      {/* Weather Alerts if severe */}
      {forecast && <WeatherAlertBanner forecast={forecast} />}

      {/* 7. TODAY'S TASKS */}
      <Card className={`border ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{tr('Today\'s Scheduled Tasks', 'مهام المزرعة المجدولة لليوم', 'Tâches du jour')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TodayTasks level="farmer" onOpenTool={onOpenTool} />
        </CardContent>
      </Card>

      {/* 8. QUICK SHORTCUT BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction
          icon={FileText}
          color="#047857"
          label={tr('Field Record Book', 'دفتر سجل الحقل', 'Carnet de parcelle')}
          onClick={() => onOpenTool('farm', 'collapse_field_records')}
        />
        <QuickAction
          icon={Camera}
          color="#0891b2"
          label={tr('AI Crop Scout', 'الفحص بالذكاء', 'Diagnostic IA')}
          onClick={() => onOpenTool('farm', 'collapse_ai_scout')}
        />
        <QuickAction
          icon={Droplets}
          color="#0284c7"
          label={tr('Water Budget', 'ميزانية السقي', 'Bilan hydrique')}
          onClick={() => onOpenTool('farm', 'collapse_water_budget')}
        />
        <QuickAction
          icon={DollarSign}
          color="#f59e0b"
          label={tr('Crop Simulator', 'محاكي الأرباح', 'Simulateur')}
          onClick={() => onNavigate('simulator')}
        />
      </div>

      {/* 9. RECENT FIELD RECORDS TIMELINE */}
      {recentRecords.length > 0 && (
        <Card className={`border ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-bold">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{tr('Recent Field Records', 'آخر السجلات والنشاطات المسجلة', 'Derniers enregistrements')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 font-semibold gap-1"
                onClick={() => onOpenTool('farm', 'collapse_field_records')}
              >
                <span>{tr('View All in Book', 'فتح السجل الكامل', 'Voir tout')}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRecords.map((rec: any, i: number) => (
              <div key={i} className="flex items-center gap-2.5 text-xs py-2 border-b border-border/40 last:border-0">
                <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                  {rec.kind || rec.type || rec.category || 'record'}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{rec.title || rec.description || rec.note || '—'}</div>
                  {rec.summary && <div className="text-[11px] text-muted-foreground truncate">{rec.summary}</div>}
                </div>
                <span className="text-muted-foreground font-mono text-[10px] shrink-0">
                  {rec.date ? new Date(rec.date).toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : undefined) : ''}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 10. FARM AT A GLANCE */}
      <Card className={`border ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>{tr('Farm at a Glance', 'مزرعتي في لمحة', 'Ma ferme en un coup d\'œil')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FarmStats />
        </CardContent>
      </Card>

      {/* Escape hatch: Browse full library */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
        <div>
          <p className="text-sm font-semibold">{tr('Need advanced tools?', 'هل تحتاج أدوات هندسية متقدمة؟', 'Besoin d\'outils avancés ?')}</p>
          <p className="text-xs text-muted-foreground">{tr('Explore the full catalog with satellite NDVI and financial planner.', 'استكشف الفهرس الشامل مع خرائط الأقمار الصناعية والتخطيط المالي.', 'Accédez au catalogue complet avec NDVI satellite et gestion financière.')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate('farm')} className="gap-1.5 font-semibold text-xs">
          <span>{tr('All Tools', 'كل الأدوات', 'Tous les outils')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function QuickAction({ icon: Icon, color, label, onClick }: { icon: typeof FileText; color: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all min-h-[95px]"
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-xl" style={{ background: `${color}18`, color }}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-bold text-foreground text-center leading-tight">{label}</span>
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
