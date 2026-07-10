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
  Cloud, Sun, Droplets, MapPin, RefreshCw, AlertTriangle,
  Sprout, Clock, Sparkles, Tractor, BookOpen, Wrench,
  ArrowRight, Zap, Calendar,
} from 'lucide-react';
import {
  getForecast, wmoDescription, type ForecastResult,
} from '@/lib/open-meteo';
import {
  getRecentTools, recordToolUse,
  type ToolEntry,
} from '@/lib/tool-registry';
import { WeatherAlertBanner } from '@/components/agri/weather-alert-banner';
import { FarmStats } from '@/components/agri/farm-stats';

const FARM_PROFILE_KEY = 'farm_profile_v1';
const LAST_LOC_KEY = 'et_tracker_last_loc_v1';

interface FarmProfile {
  name?: string;
  area?: number;
  mainCrops?: string;
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

  // Load farm profile + recent tools from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FARM_PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch { /* ignore */ }
    setRecent(getRecentTools());
  }, []);

  // Fetch weather using saved location from ET Tracker
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      let lat = 37.77, lng = -122.42;  // default: SF
      try {
        const saved = localStorage.getItem(LAST_LOC_KEY);
        if (saved) {
          const obj = JSON.parse(saved);
          const la = parseFloat(obj.lat), ln = parseFloat(obj.lng);
          if (Number.isFinite(la) && Number.isFinite(ln)) {
            lat = la; lng = ln;
          }
        }
      } catch { /* use default */ }
      const f = await getForecast(lat, lng, { days: 4 });
      setForecast(f);
    } catch (e: any) {
      setWeatherError(e?.message || 'Weather unavailable');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather(); /* eslint-disable-line */ }, []);

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
              <Sprout className="h-3.5 w-3.5" /> {profile.name ? `${profile.name}` : 'Your AI-powered agronomy platform'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">
              {greeting()}, farmer 👋
            </h2>
            <p className="text-emerald-100 text-xs mt-1">
              {today
                ? `Today's ET₀ is ${today.et0.toFixed(1)} mm · ${wmoDescription(today.weatherCode).label.toLowerCase()}`
                : 'Loading today\'s conditions…'}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenSearch}
            className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0"
          >
            <Sparkles className="h-3.5 w-3.5" /> Search tools (⌘K)
          </Button>
        </div>
      </section>

      {/* Weather alert banner — proactive warnings */}
      <WeatherAlertBanner forecast={forecast} />

      {/* Farm stats — aggregate counts */}
      <section>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Farm at a Glance</div>
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
              <MapPin className="h-3 w-3" /> Current Weather
            </div>
            <Button size="sm" variant="ghost" onClick={fetchWeather} disabled={weatherLoading} className="h-6 w-6 p-0">
              <RefreshCw className={`h-3 w-3 ${weatherLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {weatherLoading && <WeatherSkeleton />}

          {!weatherLoading && weatherError && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 py-4">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Weather unavailable: {weatherError}. ET Tracker still works — open it to set your location.</span>
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
                  <div><span className="text-muted-foreground">RH</span> <strong className="font-mono">{current.relativeHumidity}%</strong></div>
                  <div><span className="text-muted-foreground">Wind</span> <strong className="font-mono">{current.windSpeed10m.toFixed(1)} km/h</strong></div>
                  <div><span className="text-muted-foreground">Hi/Lo</span> <strong className="font-mono">{today.tempMax.toFixed(0)}°/{today.tempMin.toFixed(0)}°</strong></div>
                  <div><span className="text-muted-foreground">Rain</span> <strong className="font-mono">{today.precipitationSum.toFixed(1)} mm</strong></div>
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
            <Droplets className="h-3 w-3" /> Today's Water Need
          </div>
          {today ? (
            <>
              <div className="text-4xl font-bold text-cyan-700 dark:text-cyan-300 leading-tight">
                {today.et0.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">mm</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Reference ET₀ (FAO-56)</div>
              <div className="mt-auto pt-3 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Rain today</span>
                  <span className="font-mono font-semibold">{today.precipitationSum.toFixed(1)} mm</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Net irrigation</span>
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
                  Open ET Tracker <ArrowRight className="h-3 w-3" />
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
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction
            icon={Sprout}
            color="#16a34a"
            label="Fertilization plan"
            desc="20 crops · NPK schedule"
            onClick={() => { recordToolUse('fertilization'); onOpenTool('farm', 'collapse_fertilization'); }}
          />
          <QuickAction
            icon={Clock}
            color="#0ea5e9"
            label="Irrigation schedule"
            desc="Controllers · YAML export"
            onClick={() => { recordToolUse('irrigation-scheduler'); onOpenTool('farm', 'collapse_irr_sched'); }}
          />
          <QuickAction
            icon={Sparkles}
            color="#6366f1"
            label="Ask AI specialist"
            desc="10 agents · Crop Scout, etc."
            onClick={() => { recordToolUse('ai-specialists'); onOpenTool('insights', 'collapse_agent_chat'); }}
          />
          <QuickAction
            icon={MapPin}
            color="#10b981"
            label="Import field"
            desc="GeoJSON · KML · CSV"
            onClick={() => { recordToolUse('field-boundary'); onOpenTool('farm', 'collapse_boundary'); }}
          />
        </div>
      </section>

      {/* =================================================================== */}
      {/* Recent tools */}
      {/* =================================================================== */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recently Used
            </div>
            <Button size="sm" variant="ghost" onClick={onOpenSearch} className="text-[10px] h-6 gap-1">
              <Sparkles className="h-3 w-3" /> Browse all (⌘K)
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.map(tool => {
              const Icon = tool.icon;
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
                    <div className="text-xs font-medium leading-tight truncate max-w-[140px]">{tool.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{tool.description}</div>
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
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Browse by Category</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <NavCard icon={Tractor} label="Farm" desc="Fields, crops, soil, livestock, irrigation" color="#16a34a" onClick={() => onNavigate('farm')} />
          <NavCard icon={Sparkles} label="Insights" desc="NDVI, weather, AI, financial, community" color="#6366f1" onClick={() => onNavigate('insights')} />
          <NavCard icon={Wrench} label="Tools" desc="18 free agronomic calculators" color="#0891b2" onClick={() => onNavigate('tools')} />
          <NavCard icon={BookOpen} label="Formulas" desc="332 formulas with calculators" color="#f59e0b" onClick={() => onNavigate('formulas')} />
        </div>
      </section>
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

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
