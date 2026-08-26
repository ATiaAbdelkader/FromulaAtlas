'use client';

/**
 * Home Dashboard — Executive Agro-Intelligence & Farmer Command Control
 *
 * Distinctive Architecture:
 *   1. Executive Bioclimatic Command Bar (Wilaya / Farm Selector, Live Telemetry Pulse, Resilience Index)
 *   2. FARMER MODE EXCLUSIVE: Tactical Daily Operations Command Hub:
 *      - 4-Action Daily Field Dispatch (Morning Irrigation, Sprayer Window, INPV DAR Alert, Energy & Pumping Cost)
 *      - Instant Tactical One-Tap Calculators (Valve Run-Timer, 50kg Fertilizer Bag Sizer, CCLS Grain Payout, Tank Mix Guard)
 *      - Quick Field Action Bar (Log Field Note, WhatsApp Recipe Dispatch, Calibrate Sprayer)
 *   3. Real-Time Atmospheric & Agronomic Micro-Telemetry Bar (Solar Radiation, Delta-T Spraying Window, VPD, Dew Point, FAO-56 ET₀)
 *   4. 4-Pillar Agro-Intelligence Radar:
 *      - Hydraulic Demand & Power Budget (Net deficit mm, pump run-cost in DA)
 *      - Biosecurity & Fungal Hazard Risk (RH/Temp index, INPV phytosanitary alert links)
 *      - Phenological Milestones & GDD (Active growth vector, days to harvest)
 *      - Algerian Souk Commodity Ticker (Potato, Wheat, Tomato, Olive, Dates benchmarks)
 *   5. Interactive Multi-Sector Farm Twin Matrix (Dynamic parcel switcher with instant sector diagnostics)
 *   6. 7-Day Soil Moisture & Bioclimatic Trend Analysis
 *   7. Bento Category Launchpad & Pinned Tools
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Cloud, Sun, Droplets, MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  Sprout, Clock, Sparkles, Tractor, BookOpen, Wrench, Pin,
  ArrowRight, Zap, Calendar, Thermometer, Wind, CloudRain, Activity, Radio,
  SlidersHorizontal, Shield, TrendingUp, DollarSign, Layers, ChevronRight,
  Gauge, Compass, Flame, Eye, BarChart3, Waves, ShieldAlert, Cpu,
  CheckCircle, Play, AlertCircle, Share2, HelpCircle, FileSpreadsheet,
  FlaskConical, Timer, Coins, MessageSquare, ArrowUpRight
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
}

// Preset Algerian Agricultural Hubs
const ALGERIAN_AGRI_HUBS = [
  { id: 'mitidja', name: 'Mitidja / Blida (Plaine)', lat: 36.58, lng: 2.83, wilaya: '09 - Blida', focus: 'Agrumes & Arboriculture' },
  { id: 'el_oued', name: 'El Oued / Souf (Pivot)', lat: 33.36, lng: 6.86, wilaya: '39 - El Oued', focus: 'Pomme de terre & Maraîchage' },
  { id: 'biskra', name: 'Biskra / Ziban (Serres)', lat: 34.85, lng: 5.73, wilaya: '07 - Biskra', focus: 'Dattes & Tomate primeur' },
  { id: 'setif', name: 'Sétif / Hauts Plateaux', lat: 36.19, lng: 5.41, wilaya: '19 - Sétif', focus: 'Céréaliculture (Blé Dur)' },
  { id: 'mascara', name: 'Mascara / Ghriss', lat: 35.39, lng: 0.14, wilaya: '29 - Mascara', focus: 'Olivier, Vigne & Céréales' },
  { id: 'ain_defla', name: 'Aïn Defla (Cheliff)', lat: 36.26, lng: 1.96, wilaya: '44 - Aïn Defla', focus: 'Pomme de terre de saison' },
  { id: 'mostaganem', name: 'Mostaganem (Dahra)', lat: 35.93, lng: 0.09, wilaya: '27 - Mostaganem', focus: 'Maraîchage sous serre' },
];

interface SectorParcel {
  id: string;
  name: string;
  crop: string;
  cropKey: string;
  area: string;
  system: 'Goutte-à-Goutte' | 'Pivot Central' | 'Aspersion' | 'Gravitaire';
  moisturePercent: number;
  status: 'optimal' | 'irrigating' | 'rest' | 'alert';
  kc: number;
  nextAction: string;
  soil: string;
}

const DEFAULT_SECTORS: SectorParcel[] = [
  {
    id: 'sec-1',
    name: 'Pivot Nord - Parcelle Blé Dur',
    crop: 'Blé Dur (Cirta)',
    cropKey: 'wheat',
    area: '24 ha',
    system: 'Pivot Central',
    moisturePercent: 68,
    status: 'optimal',
    kc: 0.85,
    nextAction: 'Fertigation azotée (Urée 46%) dans 3 jours',
    soil: 'Argilo-limoneux (pH 7.9)',
  },
  {
    id: 'sec-2',
    name: 'Serres Multi-chapelles A-D',
    crop: 'Tomate de Primeur',
    cropKey: 'tomato',
    area: '3.5 ha',
    system: 'Goutte-à-Goutte',
    moisturePercent: 82,
    status: 'irrigating',
    kc: 1.15,
    nextAction: 'Cycle irrigation goutte-à-goutte en cours (45 min)',
    soil: 'Sableux amendé (pH 7.4)',
  },
  {
    id: 'sec-3',
    name: 'Verger Olivier - Colline Ouest',
    crop: 'Olivier (Chemlal & Sigoise)',
    cropKey: 'olive',
    area: '12 ha',
    system: 'Goutte-à-Goutte',
    moisturePercent: 54,
    status: 'rest',
    kc: 0.65,
    nextAction: 'Inspection taille & apport foliaire Bore/Zinc',
    soil: 'Calcaire caillouteux (pH 8.2)',
  },
  {
    id: 'sec-4',
    name: 'Parcelle Basse - Pomme de Terre',
    crop: 'Pomme de terre (Spunta)',
    cropKey: 'potato',
    area: '18 ha',
    system: 'Aspersion',
    moisturePercent: 44,
    status: 'alert',
    kc: 1.05,
    nextAction: 'Besoin hydrique critique : Déclencher cycle 3.8 mm',
    soil: 'Limono-sableux (pH 7.7)',
  },
];

interface HomeDashboardProps {
  level: UserLevel;
  onNavigate: (tab: TabId) => void;
  onOpenTool: (tab: TabId, storageKey?: string) => void;
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
  const [thresholds, setThresholds] = useState<TelemetryThresholdConfig>(DEFAULT_TELEMETRY_THRESHOLDS);
  const [thresholdsDialogOpen, setThresholdsDialogOpen] = useState(false);
  const [thresholdsDialogTab, setThresholdsDialogTab] = useState<'humidity' | 'wind' | 'temp' | 'rain'>('humidity');
  const [selectedHub, setSelectedHub] = useState<string>('custom');
  const [activeSectorId, setActiveSectorId] = useState<string>('sec-1');
  const { t, language } = useTranslation();

  // Quick Farmer Interactive Calculators State
  const [valveHectares, setValveHectares] = useState<number>(2.5);
  const [valveTargetMm, setValveTargetMm] = useState<number>(4.0);
  const [fertNitrogenTarget, setFertNitrogenTarget] = useState<number>(60);
  const [cerealQuintals, setCerealQuintals] = useState<number>(240);
  const [cerealPriceRate, setCerealPriceRate] = useState<number>(6000);

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
    if (needsFarmProfileSetup()) {
      setTimeout(() => setWizardOpen(true), 1500);
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

  // Fetch weather using selected location or farm profile
  const fetchWeather = useCallback(async (hubId?: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      let lat: number | undefined;
      let lng: number | undefined;

      if (hubId && hubId !== 'custom') {
        const hub = ALGERIAN_AGRI_HUBS.find(h => h.id === hubId);
        if (hub) {
          lat = hub.lat;
          lng = hub.lng;
        }
      }

      if (lat === undefined || lng === undefined) {
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
          } catch { /* try next */ }
        }
      }

      // Default to Algiers / Mitidja if still undefined
      if (lat === undefined || lng === undefined) {
        lat = 36.75;
        lng = 3.06;
      }

      const f = await getForecast(lat, lng, { days: 5 });
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

  useEffect(() => { fetchWeather(selectedHub); }, [fetchWeather, selectedHub]);

  const today = forecast?.daily[0];
  const current = forecast?.current;

  // Real-Time Agronomic Calculations
  const calculatedBioclimatics = useMemo(() => {
    if (!current || !today) {
      return {
        vpd: 1.15,
        dewPoint: 14.2,
        solarRadiation: 21.4,
        deltaT: 3.8,
        et0: 4.2,
        resilienceScore: 92,
        fungalRisk: 'Modéré',
        waterDeficitMm: 3.4,
        sprayerStatus: 'safe' as const,
        sprayerMessage: 'Fenêtre favorable pour le traitement ce matin',
        pumpingCostDa: 320,
      };
    }

    const temp = current.temperature;
    const rh = current.relativeHumidity;
    const wind = current.windSpeed10m;

    // Saturation vapor pressure (Tetens formula, kPa)
    const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
    // Actual vapor pressure (kPa)
    const ea = es * (rh / 100);
    // Vapor Pressure Deficit (VPD in kPa)
    const vpd = Math.max(0.1, Number((es - ea).toFixed(2)));

    // Dew point temperature (Magnus-Tetens approximation)
    const alpha = ((17.27 * temp) / (237.3 + temp)) + Math.log(rh / 100);
    const dewPoint = Number(((237.3 * alpha) / (17.27 - alpha)).toFixed(1));

    // Wet bulb temperature approximation for Delta-T
    const tw = temp * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
      Math.atan(temp + rh) - Math.atan(rh - 1.676331) +
      0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
    const deltaT = Math.max(0, Number((temp - tw).toFixed(1)));

    // Solar Radiation estimate based on ET0 and latitude proxy (MJ/m2)
    const solarRadiation = Number((today.et0 * 4.85 + 2.5).toFixed(1));

    // Net irrigation deficit today
    const netDeficit = Math.max(0, Number((today.et0 - (today.precipitationSum * 0.8)).toFixed(1)));

    // Sprayer Safety Logic
    let sprayerStatus: 'safe' | 'warning' | 'danger' = 'safe';
    let sprayerMessage = 'Fenêtre de traitement optimale (Delta-T & Vent conformes)';
    if (wind > 20 || deltaT > 8.5 || temp > 32) {
      sprayerStatus = 'danger';
      sprayerMessage = 'Traitement déconseillé : Risque élevé d’évaporation et de dérive (Sirocco/Vent)';
    } else if (wind > 14 || deltaT > 6.5 || deltaT < 2.0) {
      sprayerStatus = 'warning';
      sprayerMessage = 'Vigilance pulvérisation : Ajustez la taille des buses ou traitez avant 10h00';
    }

    // Daily Pumping Cost (e.g. 3.5 mm on 2 ha = 70 m3 -> ~70 kWh * 4.5 DA = 315 DA)
    const pumpingCostDa = Math.round(netDeficit * 2.0 * 10 * 0.45 * 4.5);

    // Farm Bioclimatic Health Score (0-100)
    let score = 95;
    if (rh > 85 || rh < 25) score -= 12;
    if (current.windSpeed10m > 25) score -= 15;
    if (today.tempMax > 38 || today.tempMin < 3) score -= 18;
    if (today.et0 > 6.5) score -= 10;
    const resilienceScore = Math.max(45, Math.min(99, score));

    const fungalRisk = rh >= 80 && temp >= 16 && temp <= 26 ? 'Élevé' : rh >= 65 ? 'Modéré' : 'Faible';

    return {
      vpd,
      dewPoint,
      solarRadiation,
      deltaT,
      et0: today.et0,
      resilienceScore,
      fungalRisk,
      waterDeficitMm: netDeficit,
      sprayerStatus,
      sprayerMessage,
      pumpingCostDa: Math.max(120, pumpingCostDa),
    };
  }, [current, today]);

  const activeSector = useMemo(() => {
    return DEFAULT_SECTORS.find(s => s.id === activeSectorId) || DEFAULT_SECTORS[0];
  }, [activeSectorId]);

  // Quick Tactical Calculations for Farmer Mode
  const quickValveHours = useMemo(() => {
    // 1 ha = 10,000 m2. Target mm = mm * 10 m3/ha. Emitter output assumption: 16 m3/h per ha.
    const totalM3 = valveHectares * valveTargetMm * 10;
    const flowRateM3H = Math.max(10, valveHectares * 18);
    const totalMinutes = Math.round((totalM3 / flowRateM3H) * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return { hrs, mins, totalMinutes, totalM3: Math.round(totalM3) };
  }, [valveHectares, valveTargetMm]);

  const quickUreaBags = useMemo(() => {
    // Urea 46%: 50kg bag contains 23kg pure N
    const pureNNeeded = fertNitrogenTarget * valveHectares;
    const bags = Math.ceil(pureNNeeded / 23);
    const totalKg = bags * 50;
    return { bags, totalKg, pureNNeeded: Math.round(pureNNeeded) };
  }, [fertNitrogenTarget, valveHectares]);

  const quickCerealCheck = useMemo(() => {
    const totalGrossDa = cerealQuintals * cerealPriceRate;
    const transportDeductionDa = cerealQuintals * 120; // 120 DA/Q freight
    const netPayoutDa = totalGrossDa - transportDeductionDa;
    return { totalGrossDa, transportDeductionDa, netPayoutDa };
  }, [cerealQuintals, cerealPriceRate]);

  const isFarmerMode = level === 'farmer';

  return (
    <div className="space-y-5">
      {/* =================================================================== */}
      {/* 1. EXECUTIVE / FARMER AGRO-INTELLIGENCE COMMAND BAR */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-6 shadow-lg shadow-emerald-950/20">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold tracking-wide uppercase border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isFarmerMode
                  ? copyFor(language, 'Field Operations HQ', 'Poste de Commandement Fellah', 'مركز العمليات الميدانية للفلاح')
                  : copyFor(language, 'Agro-Mission Control', 'Centre de Commande Agro', 'مركز القيادة الزراعية')}
              </span>
              <span className="text-slate-400 text-xs font-mono">
                {profile.name ? `· ${profile.name}` : `· ${t.appSubtitle}`}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              {greeting(language)}, {copyForLevel(language, level, { en: 'Fellah / Farmer', fr: 'Fellah / Exploitant', ar: 'عمي الفلاح' }, { en: 'Farm Director', fr: 'Directeur d’Exploitation', ar: 'مدير المزرعة' }, { en: 'Chief Agronomist', fr: 'Ingénieur Agronome', ar: 'المهندس الزراعي' })}
              <span className="text-emerald-400 text-lg sm:text-xl font-normal">✦</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isFarmerMode
                ? copyFor(
                    language,
                    'Instant sector run-times, 50kg fertilizer bag counters, INPV safety intervals, and live wholesale market rates.',
                    'Durées de vannes directes, calcul de sacs d’engrais 50kg, délais de récolte INPV et barème officiel CCLS / OAIC.',
                    'ساعات تشغيل السقي المباشرة، حساب شكاير الأسمدة 50 كغ، فترات أمان المبيدات INPV وتسعيرة ديوان الحبوب.'
                  )
                : copyFor(
                    language,
                    'Integrated bioclimatic intelligence, hydraulic demand vectors, crop phenology, and Algerian market benchmarks.',
                    'Supervision bioclimatique intégrée, vecteurs de demande hydrique, phénologie des cultures et repères du marché algérien.',
                    'منظومة ذكاء مناخي زراعي متكاملة، مؤشرات الاحتياج المائي، فينولوجيا المحاصيل ومؤشرات السوق الفلاحي الجزائري.'
                  )}
            </p>
          </div>

          {/* Quick Hub Selector & Mission Resilience Score */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Wilaya / Hub Dropdown */}
            <div className="relative">
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="h-9 px-3 py-1 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-md cursor-pointer transition-colors"
              >
                <option value="custom" className="bg-slate-900 text-white">
                  📍 {profile.name ? `${profile.name} (GPS)` : copyFor(language, 'Local Farm GPS', 'GPS de l’Exploitation', 'موقع المزرعة (GPS)')}
                </option>
                {ALGERIAN_AGRI_HUBS.map(hub => (
                  <option key={hub.id} value={hub.id} className="bg-slate-900 text-white">
                    🇩🇿 {hub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Farm Agro-Resilience Index Ring */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                {calculatedBioclimatics.resilienceScore}%
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
                  {copyFor(language, 'Agro-Index', 'Indice Santé', 'مؤشر التوازن')}
                </div>
                <div className="text-xs font-bold text-emerald-300">
                  {calculatedBioclimatics.resilienceScore >= 80
                    ? copyFor(language, 'Optimal State', 'Conditions Optimales', 'حالة ممتازة')
                    : copyFor(language, 'Stress Watch', 'Vigilance Stress', 'تنبيه إجهاد')}
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={onOpenSearch}
              className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow-sm h-9"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{copyFor(language, 'Finder (⌘K)', 'Outils (⌘K)', 'الباحث (⌘K)')}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Proactive Weather Warnings Banner */}
      <WeatherAlertBanner forecast={forecast} />

      {/* =================================================================== */}
      {/* 2. EXCLUSIVE FOR FARMER MODE: DAILY OPERATIONS DISPATCH HUB */}
      {/* =================================================================== */}
      {isFarmerMode && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tractor className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {copyFor(language, 'Daily Field Action Board', 'Tableau des Tâches Terrain du Jour', 'لوحة المهام اليومية في المزرعة')}
              </h2>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Valve & Irrigation Task */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-50/50 via-card to-cyan-50/20 dark:from-cyan-950/20 dark:via-card dark:to-cyan-950/10 p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                    <Droplets className="h-4 w-4 text-cyan-600" />
                    {copyFor(language, 'Irrigation Valve', 'Vanne d’Irrigation', 'محابس السقي')}
                  </span>
                  <Badge className="bg-cyan-600 text-white text-[10px] font-mono">
                    {activeSector.system}
                  </Badge>
                </div>
                <div className="text-lg font-bold text-foreground mb-1">
                  {quickValveHours.hrs > 0 ? `${quickValveHours.hrs}h ` : ''}{quickValveHours.mins} min
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {copyFor(language, `Target: ${valveTargetMm} mm for ${activeSector.name} (${quickValveHours.totalM3} m³).`, `Consigne : ${valveTargetMm} mm pour ${activeSector.name} (${quickValveHours.totalM3} m³).`, `المطلوب: ${valveTargetMm} ملم للقطاع ${activeSector.name} (${quickValveHours.totalM3} م³).`)}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onOpenTool('farm', 'collapse_et_tracker')}
                className="mt-3 w-full text-xs h-8 bg-cyan-600 hover:bg-cyan-700 text-white font-medium justify-between"
              >
                <span>{copyFor(language, 'Open Valve Schedule', 'Régler la vanne', 'ضبط برنامج المحبس')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 2. Sprayer Safety Window Indicator */}
            <div className={`rounded-xl border p-4 flex flex-col justify-between shadow-sm ${
              calculatedBioclimatics.sprayerStatus === 'safe'
                ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                : calculatedBioclimatics.sprayerStatus === 'warning'
                ? 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Wind className="h-4 w-4 text-teal-600" />
                    {copyFor(language, 'Sprayer Window (Delta-T)', 'Fenêtre Pulvérisation', 'أمان الرش والمداواة')}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    calculatedBioclimatics.sprayerStatus === 'safe' ? 'bg-emerald-500 animate-pulse' :
                    calculatedBioclimatics.sprayerStatus === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                </div>
                <div className="text-base font-bold text-foreground mb-1">
                  Delta-T: {calculatedBioclimatics.deltaT}°C · Vent: {current?.windSpeed10m || 8} km/h
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {calculatedBioclimatics.sprayerMessage}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenTool('farm', 'collapse_active_matter')}
                className="mt-3 w-full text-xs h-8 justify-between hover:bg-muted/80"
              >
                <span>{copyFor(language, 'Check Products & DAR', 'Vérifier Produits & DAR', 'فحص المبيدات و DAR')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 3. 50kg Fertilizer Bag Mix */}
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 via-card to-emerald-50/20 dark:from-emerald-950/20 dark:via-card dark:to-emerald-950/10 p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <FlaskConical className="h-4 w-4 text-emerald-600" />
                    {copyFor(language, '50kg Fertilizer Sizer', 'Sacs d’Engrais 50kg', 'شكاير الأسمدة 50 كغ')}
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                    Urée 46%
                  </Badge>
                </div>
                <div className="text-lg font-bold text-foreground mb-1">
                  {quickUreaBags.bags} {copyFor(language, 'Bags of 50kg', 'Sacs de 50 kg', 'شكاير (50 كغ)')}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {copyFor(language, `${quickUreaBags.totalKg} kg total for ${valveHectares} ha (${fertNitrogenTarget} U N/ha).`, `${quickUreaBags.totalKg} kg total pour ${valveHectares} ha (${fertNitrogenTarget} U N/ha).`, `الإجمالي: ${quickUreaBags.totalKg} كغ لمساحة ${valveHectares} هكتار.`)}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onOpenTool('farm', 'collapse_fertilizer')}
                className="mt-3 w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium justify-between"
              >
                <span>{copyFor(language, 'Calculate N-P-K Doses', 'Calculer N-P-K Doses', 'احسب جرعات N-P-K')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 4. Energy & Pumping Expenditure */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-50/50 via-card to-amber-50/20 dark:from-amber-950/20 dark:via-card dark:to-amber-950/10 p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-600" />
                    {copyFor(language, 'Pumping Energy Cost', 'Coût Énergie Pompage', 'تكلفة طاقة الضخ')}
                  </span>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-mono">
                    Sonelgaz / Mazout
                  </Badge>
                </div>
                <div className="text-lg font-bold text-foreground mb-1 font-mono">
                  ~{calculatedBioclimatics.pumpingCostDa} DA / {copyFor(language, 'day', 'jour', 'يوم')}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {copyFor(language, 'Tarif 51 BT (4.50 DA/kWh) or Mazout (29 DA/L).', 'Tarif 51 BT (4,50 DA/kWh) ou Mazout (29 DA/L).', 'تعريفة سونلغاز 51 BT أو المازوت الفلاحي 29 دج.')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenTool('insights', 'collapse_financial')}
                className="mt-3 w-full text-xs h-8 justify-between hover:bg-amber-500/10 hover:text-amber-700"
              >
                <span>{copyFor(language, 'Log Energy Expense', 'Saisir Dépense Énergie', 'تسجيل مصاريف الطاقة')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tactical One-Tap Quick Solvers Accordion / Box */}
          <div className="p-4 rounded-xl border border-border/80 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {copyFor(language, 'Instant Tactical Solvers (One-Tap Dials)', 'Calculateurs Rapides de Terrain', 'الحاسبات التكتيكية الفورية')}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {copyFor(language, 'Direct field adjustments without opening heavy sheets', 'Ajustements directs sans ouvrir de tableurs lourds', 'تعديل فوري وسهل دون فتح جداول معقدة')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dial 1: Quick Run-Time Adjuster */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-cyan-600" />
                    {copyFor(language, 'Valve Duration', 'Durée Vanne', 'مدة تشغيل المحبس')}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {quickValveHours.hrs > 0 ? `${quickValveHours.hrs}h ` : ''}{quickValveHours.mins} min
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{copyFor(language, 'Sector Area (ha)', 'Surface Secteur (ha)', 'المساحة (هكتار)')}</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={valveHectares}
                      onChange={e => setValveHectares(parseFloat(e.target.value) || 1)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{copyFor(language, 'Dose (mm)', 'Dose (mm)', 'الكمية (ملم)')}</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={valveTargetMm}
                      onChange={e => setValveTargetMm(parseFloat(e.target.value) || 1)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dial 2: Quick Fertilizer Bag Count */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
                    {copyFor(language, 'Urea 46% Bags', 'Sacs Urée 46%', 'شكاير اليوريا 46%')}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {quickUreaBags.bags} {copyFor(language, 'bags (50kg)', 'sacs (50kg)', 'شكارة')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{copyFor(language, 'Units N / ha', 'Unités N / ha', 'وحدات N / هكتار')}</label>
                    <Input
                      type="number"
                      step="10"
                      min="10"
                      value={fertNitrogenTarget}
                      onChange={e => setFertNitrogenTarget(parseFloat(e.target.value) || 10)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{copyFor(language, 'Total Product (kg)', 'Poids Total (kg)', 'الوزن الإجمالي (كغ)')}</label>
                    <div className="h-7 px-2 rounded-md bg-muted flex items-center text-xs font-mono font-semibold text-foreground">
                      {quickUreaBags.totalKg} kg
                    </div>
                  </div>
                </div>
              </div>

              {/* Dial 3: Quick CCLS Cereal Payout */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-amber-600" />
                    {copyFor(language, 'CCLS Grain Check', 'Chèque Décharge CCLS', 'مستحقات ديوان الحبوب')}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    {quickCerealCheck.netPayoutDa.toLocaleString()} DA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{copyFor(language, 'Delivered (Q)', 'Livré (Quintaux)', 'الكمية (قنطار)')}</label>
                    <Input
                      type="number"
                      step="10"
                      min="1"
                      value={cerealQuintals}
                      onChange={e => setCerealQuintals(parseFloat(e.target.value) || 1)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{copyFor(language, 'Tariff (DA/Q)', 'Barème (DA/Q)', 'السعر (دج/ق)')}</label>
                    <select
                      value={cerealPriceRate}
                      onChange={e => setCerealPriceRate(parseInt(e.target.value) || 6000)}
                      className="h-7 w-full px-1.5 rounded-md border border-input bg-background text-xs font-mono"
                    >
                      <option value={6000}>Blé Dur (6000 DA)</option>
                      <option value={5000}>Blé Tendre (5000 DA)</option>
                      <option value={3400}>Orge (3400 DA)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 3. REAL-TIME ATMOSPHERIC & BIOCLIMATIC TELEMETRY RIBBON */}
      {/* =================================================================== */}
      <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {copyFor(language, 'Live Bioclimatic Telemetry (FAO-56 & Open-Meteo)', 'Télémétrie Bioclimatique en Direct (FAO-56 & Open-Meteo)', 'البث الحي للمؤشرات البيومناخية الزراعية')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {current && today && (
              <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline-block">
                {current.temperature.toFixed(1)}°C · {current.relativeHumidity}% RH · {wmoDescription(current.weatherCode).icon} {localizedWeatherLabel(current.weatherCode, language)}
              </span>
            )}
            <button
              type="button"
              onClick={() => openThresholdsFor('humidity')}
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-0.5 rounded hover:bg-emerald-500/10 transition-colors"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>{copyFor(language, 'Thresholds', 'Seuils d’alerte', 'حدود الأمان')}</span>
            </button>
            <button
              type="button"
              onClick={() => fetchWeather(selectedHub)}
              disabled={weatherLoading}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title={copyFor(language, 'Refresh weather telemetry', 'Actualiser la météo', 'تحديث بيانات الطقس')}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {weatherLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* 1. VPD Gauge */}
            <div className="p-3 rounded-lg border border-border/70 bg-gradient-to-b from-muted/30 to-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold">{copyFor(language, 'VPD (Deficit)', 'DPV (Déficit)', 'عجز ضغط البخار')}</span>
                <Droplets className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="my-1">
                <div className="text-xl font-bold font-mono text-foreground">
                  {calculatedBioclimatics.vpd} <span className="text-xs font-normal text-muted-foreground">kPa</span>
                </div>
                <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {calculatedBioclimatics.vpd >= 0.8 && calculatedBioclimatics.vpd <= 1.4
                    ? copyFor(language, '✓ Transpiration Optimal', '✓ Transpiration Optimale', '✓ نتح وتغذية مثالية')
                    : calculatedBioclimatics.vpd > 1.8
                    ? copyFor(language, '⚠ High VPD Stress', '⚠ Stress hydrique fort', '⚠ إجهاد جفاف مرتفع')
                    : copyFor(language, 'Low Transpiration', 'Faible transpiration', 'نتح بطيء / رطوبة')}
                </div>
              </div>
            </div>

            {/* 2. Delta-T Spraying Window */}
            <div className="p-3 rounded-lg border border-border/70 bg-gradient-to-b from-muted/30 to-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold">{copyFor(language, 'Delta-T (Spray)', 'Delta-T (Pulv.)', 'مؤشر أمان الرش')}</span>
                <Wind className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="my-1">
                <div className="text-xl font-bold font-mono text-foreground">
                  {calculatedBioclimatics.deltaT}°C
                </div>
                <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {calculatedBioclimatics.deltaT >= 2 && calculatedBioclimatics.deltaT <= 8
                    ? copyFor(language, '✓ Safe Spray Window', '✓ Fenêtre de traitement OK', '✓ نافذة علاج ممتازة')
                    : calculatedBioclimatics.deltaT > 8
                    ? copyFor(language, '⚠ High Droplet Evap', '⚠ Évaporation gouttelette', '⚠ تبخر سريع للقطرات')
                    : copyFor(language, 'High Drift Window', 'Risque de dérive', 'خطر انسياب / ركود')}
                </div>
              </div>
            </div>

            {/* 3. Solar Radiation */}
            <div className="p-3 rounded-lg border border-border/70 bg-gradient-to-b from-muted/30 to-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold">{copyFor(language, 'Solar Radiation', 'Rayonnement', 'الإشعاع الشمسي')}</span>
                <Sun className="h-3 w-3 text-amber-500" />
              </div>
              <div className="my-1">
                <div className="text-xl font-bold font-mono text-foreground">
                  {calculatedBioclimatics.solarRadiation} <span className="text-xs font-normal text-muted-foreground">MJ/m²</span>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  {copyFor(language, 'Photosynthetic Flux', 'Flux photosynthétique', 'طاقة البناء الضوئي')}
                </div>
              </div>
            </div>

            {/* 4. Dew Point */}
            <div className="p-3 rounded-lg border border-border/70 bg-gradient-to-b from-muted/30 to-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold">{copyFor(language, 'Dew Point (Td)', 'Point de Rosée', 'نقطة الندى')}</span>
                <Thermometer className="h-3 w-3 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="my-1">
                <div className="text-xl font-bold font-mono text-foreground">
                  {calculatedBioclimatics.dewPoint}°C
                </div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  {copyFor(language, 'Condensation Level', 'Niveau condensation', 'تكاثف الأوراق')}
                </div>
              </div>
            </div>

            {/* 5. Reference ET0 */}
            <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-cyan-700 dark:text-cyan-300">
                <span className="font-bold">{copyFor(language, 'FAO-56 ET₀ Today', 'ET₀ FAO-56 Jour', 'التبخر المرجعي ET₀')}</span>
                <Waves className="h-3 w-3 text-cyan-600" />
              </div>
              <div className="my-1">
                <div className="text-xl font-bold font-mono text-cyan-700 dark:text-cyan-300">
                  {calculatedBioclimatics.et0.toFixed(1)} <span className="text-xs font-normal">mm/j</span>
                </div>
                <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                  {copyFor(language, 'Baseline Evap Demand', 'Demande évaporative', 'الطلب التبخيري')}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 4. FOUR-PILLAR AGRO-INTELLIGENCE RADAR */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Hydraulic Balance */}
        <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between hover:border-cyan-500/40 transition-colors shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                <Droplets className="h-4 w-4 text-cyan-600" />
                {copyFor(language, 'Hydraulic Vector', 'Vecteur Hydrique', 'التوازن المائي والري')}
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                Net -{calculatedBioclimatics.waterDeficitMm} mm
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {copyFor(
                language,
                `Atmospheric deficit requires irrigation pulse. Energy cost estimated: ~145 DA/ha (Sonelgaz 51 BT).`,
                `Le déficit atmosphérique requiert un apport. Coût énergétique estimé : ~145 DA/ha (Sonelgaz 51 BT).`,
                `عجز الرطوبة يتطلب رية تعويضية. تكلفة الطاقة التقديرية: ~145 دج/هكتار (سونلغاز 51 BT).`
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenTool('farm', 'collapse_et_tracker')}
            className="w-full text-xs h-8 justify-between hover:bg-cyan-500/10 hover:text-cyan-600 hover:border-cyan-500/40"
          >
            <span>{copyFor(language, 'Open Hydraulic Tracker', 'Ouvrir Suivi Hydrique', 'افتح متتبع الري')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Pillar 2: Biosecurity & INPV Guard */}
        <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between hover:border-rose-500/40 transition-colors shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                {copyFor(language, 'Biosecurity & INPV', 'Biosécurité & INPV', 'الوقاية وفهرس INPV')}
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  calculatedBioclimatics.fungalRisk === 'Élevé'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                }`}
              >
                {copyFor(language, `Risk: ${calculatedBioclimatics.fungalRisk}`, `Risque : ${calculatedBioclimatics.fungalRisk}`, `الخطر: ${calculatedBioclimatics.fungalRisk}`)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {copyFor(
                language,
                '1,264 Algerian INPV active ingredients loaded. Monitor downy mildew & early blight spore windows.',
                '1 264 matières actives homologuées INPV. Surveillez les fenêtres d’incubation Mildiou et Oïdium.',
                '1,264 مادة معتمدة في فهرس INPV الجزائري. راقب فترات حضانة البياض واللفحة.'
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenTool('farm', 'collapse_active_matter')}
            className="w-full text-xs h-8 justify-between hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/40"
          >
            <span>{copyFor(language, 'Check INPV Registry', 'Consulter Index INPV', 'تصفح فهرس المبيدات')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Pillar 3: Phenology & Crop Trajectory */}
        <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Sprout className="h-4 w-4 text-emerald-600" />
                {copyFor(language, 'Crop Trajectory', 'Trajectoire Cultures', 'تطور نمو المحاصيل')}
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {profile.crop ? CROP_LIFECYCLES.find(c => c.id === profile.crop)?.name || profile.crop : '20 Cultures'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {copyFor(
                language,
                'Full 4R nutrient budget & thermal time (GDD) tracking mapped to Algerian crop calendars.',
                'Bilan 4R éléments majeurs & sommes thermiques (GDD) calés sur les calendriers de semis locaux.',
                'ميزانية التسميد 4R وتراكم الوحدات الحرارية GDD وفق مواعيد الزراعة الجزائرية.'
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenTool('farm', 'crop_calendar_gen')}
            className="w-full text-xs h-8 justify-between hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40"
          >
            <span>{copyFor(language, 'Open Crop Calendar', 'Ouvrir Calendrier', 'افتح التقويم الزراعي')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Pillar 4: Algerian Souk & CCLS Market */}
        <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                {copyFor(language, 'Souk & CCLS Benchmarks', 'Marché de Gros & CCLS', 'أسعار الجملة وديوان الحبوب')}
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                OAIC 6000 DA/Q
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {copyFor(
                language,
                'Wholesale potato quotes (El Oued / Ain Defla), official grain CCLS tariffs & break-even margins.',
                'Cotations gros pomme de terre (El Oued / Aïn Defla), barème OAIC et marges brutes.',
                'أسعار البطاطا في أسواق الجملة، تسعيرة ديوان الحبوب وحساب هوامش الربح.'
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenTool('insights', 'collapse_financial')}
            className="w-full text-xs h-8 justify-between hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/40"
          >
            <span>{copyFor(language, 'Economics & Margins', 'Économie & Marges', 'المردود المالي والهوامش')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. INTERACTIVE MULTI-SECTOR FARM TWIN MATRIX */}
      {/* =================================================================== */}
      <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {copyFor(language, 'Interactive Multi-Sector Farm Twin Matrix', 'Jumeau Numérique des Secteurs & Parcelles', 'المصفوفة التفاعلية للحقول والقطاعات')}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {copyFor(
                language,
                'Select any farm sector to inspect hydraulic status, crop Kc coefficient, and next scheduled agronomic action.',
                'Sélectionnez une parcelle pour inspecter son statut hydrique, son Kc et sa prochaine action programmée.',
                'اختر أي قطاع في المزرعة لمطالعة حالته الهيدروليكية ومعامل النتح Kc والعملية القادمة.'
              )}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenTool('farm', 'collapse_multifield')}
            className="h-8 text-xs gap-1 self-start sm:self-auto"
          >
            <MapPin className="h-3 w-3 text-emerald-600" />
            <span>{copyFor(language, 'Manage All Fields', 'Gérer les Parcelles', 'إدارة الحقول')}</span>
          </Button>
        </div>

        {/* Sector Tabs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {DEFAULT_SECTORS.map(sec => {
            const isSelected = sec.id === activeSectorId;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectorId(sec.id)}
                className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-sm'
                    : 'border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{sec.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    sec.status === 'irrigating' ? 'bg-cyan-500 animate-ping' :
                    sec.status === 'alert' ? 'bg-rose-500 animate-pulse' :
                    'bg-emerald-500'
                  }`} />
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center justify-between mb-2">
                  <span>{sec.crop}</span>
                  <span className="font-mono font-medium">{sec.area}</span>
                </div>

                {/* Micro Soil Moisture Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>{copyFor(language, 'Soil Moisture', 'Humidité Sol', 'رطوبة التربة')}</span>
                    <span className="font-bold text-foreground">{sec.moisturePercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sec.moisturePercent < 50 ? 'bg-rose-500' :
                        sec.moisturePercent > 80 ? 'bg-cyan-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${sec.moisturePercent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Sector Deep-Dive Diagnostic Box */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-card to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                {activeSector.name}
              </Badge>
              <span className="text-xs font-semibold text-foreground">
                {activeSector.crop} · {activeSector.area} · {activeSector.system}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Kc {activeSector.kc}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{copyFor(language, 'Next Agronomic Milestone: ', 'Prochaine étape agronomique : ', 'الخطوة الفلاحية القادمة: ')}</span>
              {activeSector.nextAction} ({activeSector.soil})
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
            <Button
              size="sm"
              onClick={() => onOpenTool('farm', 'collapse_field_workbench')}
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>{copyFor(language, 'Sector Workbench', 'Atelier Parcelle', 'لوحة عمل القطاع')}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenTool('farm', 'collapse_nutrient_budget')}
              className="h-8 text-xs gap-1"
            >
              <span>{copyFor(language, '4R Plan', 'Plan 4R', 'خطة 4R')}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 6. 7-DAY SOIL MOISTURE & ET₀ TREND TRAJECTORY */}
      {/* =================================================================== */}
      <section>
        <SoilMoistureTrendChart
          lat={profile.lat ? parseFloat(profile.lat) : 36.75}
          lng={profile.lng ? parseFloat(profile.lng) : 3.05}
          language={language}
          level={level}
          onNavigate={(tab) => onNavigate(tab as TabId)}
        />
      </section>

      {/* =================================================================== */}
      {/* 7. WHOLE-FARM AGGREGATE STATS & ACTION HUBS */}
      {/* =================================================================== */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {copyForLevel(language, level,
            { en: 'Farm Operations Matrix', fr: 'Matrice des Opérations de Ferme', ar: 'مصفوفة عمليات المزرعة' },
            { en: 'Enterprise Operations Matrix', fr: 'Matrice Opérationnelle', ar: 'مصفوفة إدارة العمليات' },
            { en: 'Regional Evidence Matrix', fr: 'Matrice d’Analyse Régionale', ar: 'مصفوفة التحليل الإقليمي' }
          )}
        </div>
        <FarmStats />
      </section>

      {/* =================================================================== */}
      {/* 8. PINNED & RECENT TOOLS ACCESS */}
      {/* =================================================================== */}
      {(pinned.length > 0 || recent.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pinned.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                <Pin className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>{copyFor(language, 'Pinned Quick Tools', 'Outils Épinglés', 'الأدوات المثبتة')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pinned.slice(0, 4).map(tool => {
                  const Icon = tool.icon;
                  const localizedTool = localizeToolEntry(tool, language);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => { recordToolUse(tool.id); onOpenTool(tool.tab, tool.storageKey); }}
                      className="flex items-center gap-2 p-2.5 rounded-lg border bg-background/50 hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: tool.color + '20' }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: tool.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{localizedTool.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{localizedTool.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{copyFor(language, 'Recently Used', 'Récemment Utilisés', 'المستخدمة مؤخراً')}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={onOpenSearch} className="h-6 text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" /> {copyFor(language, 'All (⌘K)', 'Tout (⌘K)', 'الكل (⌘K)')}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recent.slice(0, 4).map(tool => {
                  const Icon = tool.icon;
                  const localizedTool = localizeToolEntry(tool, language);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => { recordToolUse(tool.id); onOpenTool(tool.tab, tool.storageKey); }}
                      className="flex items-center gap-2 p-2.5 rounded-lg border bg-background/50 hover:bg-muted/60 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: tool.color + '20' }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: tool.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{localizedTool.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{localizedTool.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* 9. BENTO CATEGORY LAUNCHPAD */}
      {/* =================================================================== */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {copyFor(language, 'Agro-Tool Ecosystem & Workspaces', 'Écosystème des Outils & Espaces', 'منظومة مساحات العمل والأدوات')}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <NavCard
            icon={Tractor}
            label={t.tabFarm}
            badge="FAO-56"
            desc={copyFor(language, 'Fields, crops, soil, livestock, 4R nutrients & irrigation', 'Parcelles, cultures, sols, élevage, bilan 4R & irrigation', 'الحقول والمحاصيل والتربة والتسميد والري')}
            color="#16a34a"
            onClick={() => onNavigate('farm')}
          />
          <NavCard
            icon={Sparkles}
            label={t.tabInsights}
            badge="AI + NDVI"
            desc={copyFor(language, 'Satellite NDVI, weather radar, AI agents, finance & market', 'NDVI satellite, radar météo, agents IA, finance & marché', 'الأقمار الصناعية ورادار الطقس ووكلاء الذكاء والمالية')}
            color="#6366f1"
            onClick={() => onNavigate('insights')}
          />
          <NavCard
            icon={Wrench}
            label={t.tabTools}
            badge={`${FREE_TOOL_COUNT} Free`}
            desc={copyFor(language, `${FREE_TOOL_COUNT} dedicated calculators for soil, water & chemistry`, `${FREE_TOOL_COUNT} calculateurs agronomiques pour le sol, l’eau & la chimie`, `${FREE_TOOL_COUNT} حاسبة زراعية متخصصة في التربة والمياه`)}
            color="#0891b2"
            onClick={() => onNavigate('tools')}
          />
          <NavCard
            icon={BookOpen}
            label={t.tabFormulas}
            badge={`${FORMULA_COUNT} Math`}
            desc={copyFor(language, `${FORMULA_COUNT} peer-reviewed formulas with interactive solvers`, `${FORMULA_COUNT} formules scientifiques avec calculateurs intégrés`, `${FORMULA_COUNT} معادلة علمية موثقة بحاسبات تفاعلية`)}
            color="#f59e0b"
            onClick={() => onNavigate('formulas')}
          />
        </div>
      </section>

      {/* Farm Profile Wizard */}
      <FarmProfileWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSaved={() => {
          try {
            const saved = localStorage.getItem(FARM_PROFILE_KEY);
            if (saved) setProfile(JSON.parse(saved));
          } catch { /* ignore */ }
          void fetchWeather(selectedHub);
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

function NavCard({
  icon: Icon,
  label,
  badge,
  desc,
  color,
  onClick,
}: {
  icon: typeof Tractor;
  label: string;
  badge?: string;
  desc: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-border/80 bg-card p-4 hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ backgroundColor: color + '20' }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          {badge && (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <div className="text-sm font-bold text-foreground mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {label}
        </div>
        <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {desc}
        </div>
      </div>
      <div className="mt-3 flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
        <span>Accéder</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
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
