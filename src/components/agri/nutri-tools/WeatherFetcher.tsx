'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  Check,
  CloudSun,
  Crosshair,
  Loader2,
  MapPin,
} from 'lucide-react';
import {
  fetchCurrentWeather,
  fetchDailyEto,
  searchCities,
  type CurrentWeather,
  type DailyEto,
  type GeoLocation,
} from '@/lib/open-meteo';

interface WeatherFetcherProps {
  /** Called when current weather is successfully fetched. */
  onWeather: (weather: CurrentWeather, location: GeoLocation) => void;
  /** Optional — only the irrigation variant calls this. */
  onEto?: (eto: DailyEto, location: GeoLocation) => void;
  /** 'vpd' only fetches current weather; 'irrigation' also fetches daily ET₀. */
  variant: 'vpd' | 'irrigation';
}

type Status =
  | { kind: 'idle' }
  | { kind: 'fetching'; location: GeoLocation }
  | { kind: 'success'; weather: CurrentWeather; location: GeoLocation }
  | { kind: 'error'; message: string };

/**
 * Collapsible panel that lets a user pick a location (city search with
 * autocomplete, or GPS) and fetch live weather from the free Open-Meteo API.
 *
 * - Starts collapsed to avoid cluttering the host tool.
 * - All network calls happen client-side; no server routes involved.
 * - On success, calls `onWeather` (always) and `onEto` (irrigation variant
 *   only) with the parsed payloads.
 */
export function WeatherFetcher({ onWeather, onEto, variant }: WeatherFetcherProps) {
  const [open, setOpen] = useState(false);

  // City search state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noMatches, setNoMatches] = useState(false);

  // Selected location + fetch status
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autocomplete (400 ms).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearching(false);
      setNoMatches(false);
      return;
    }
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(q);
      setSuggestions(results);
      setSearching(false);
      setNoMatches(results.length === 0);
      setShowDropdown(true);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const useGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus({
        kind: 'error',
        message: 'Geolocation is not available in this browser.',
      });
      return;
    }
    setStatus({
      kind: 'fetching',
      location: { lat: 0, lng: 0, name: 'Locating…', country: '' },
    });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: GeoLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: `GPS ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`,
          country: '',
        };
        setLocation(loc);
        setStatus({ kind: 'idle' });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Enter a city instead.'
            : 'Could not get your location. Enter a city instead.';
        setStatus({ kind: 'error', message: msg });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }, []);

  const pickSuggestion = useCallback((s: GeoLocation) => {
    setLocation(s);
    setQuery(`${s.name}${s.country ? ', ' + s.country : ''}`);
    setShowDropdown(false);
    setNoMatches(false);
    setStatus({ kind: 'idle' });
  }, []);

  const handleFetch = useCallback(async () => {
    if (!location) return;
    setStatus({ kind: 'fetching', location });
    try {
      const [weather, eto] = await Promise.all([
        fetchCurrentWeather(location.lat, location.lng),
        variant === 'irrigation'
          ? fetchDailyEto(location.lat, location.lng)
          : Promise.resolve<DailyEto | null>(null),
      ]);
      if (!weather) {
        setStatus({
          kind: 'error',
          message: 'Failed to fetch weather. Check your connection.',
        });
        return;
      }
      onWeather(weather, location);
      if (eto && onEto) onEto(eto, location);
      setStatus({ kind: 'success', weather, location });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Failed to fetch weather. Check your connection.',
      });
    }
  }, [location, variant, onWeather, onEto]);

  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
      {/* Toggle header — collapsed by default */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <CloudSun className="h-4 w-4" />
          Live weather
        </span>
        <span className="text-xs text-emerald-700 dark:text-emerald-300 select-none">
          {open ? 'Hide' : 'Open'}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* City search with autocomplete dropdown */}
          <div className="relative">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                onBlur={() => {
                  // Delay so click on a suggestion registers before the dropdown closes.
                  setTimeout(() => setShowDropdown(false), 150);
                }}
                placeholder="Search city…"
                className="h-8 pl-8 text-xs"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
              )}
            </div>

            {showDropdown && suggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li key={`${s.lat}-${s.lng}-${i}`}>
                    <button
                      type="button"
                      // Prevent input blur before the click lands.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuggestion(s)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center gap-2"
                    >
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{s.name}</span>
                      {s.country && (
                        <span className="text-muted-foreground">· {s.country}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {showDropdown && noMatches && !searching && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg px-3 py-2 text-xs text-muted-foreground">
                No matching cities found.
              </div>
            )}
          </div>

          {/* GPS button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useGps}
            className="w-full h-8 text-xs border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Use my GPS
          </Button>

          {/* Selected location + Fetch button */}
          {location && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3 w-3 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">
                  <strong className="text-foreground">{location.name}</strong>
                  {location.country && <span> · {location.country}</span>}
                  <span className="text-muted-foreground">
                    {' '}
                    ({location.lat.toFixed(2)}, {location.lng.toFixed(2)})
                  </span>
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleFetch}
                disabled={status.kind === 'fetching'}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {status.kind === 'fetching' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CloudSun className="h-3.5 w-3.5" />
                )}
                Fetch weather
              </Button>
            </div>
          )}

          {/* Status banners */}
          {status.kind === 'fetching' && (
            <div className="text-[11px] text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/50 rounded px-2 py-1.5 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              Fetching weather for {status.location.name}…
            </div>
          )}
          {status.kind === 'success' && (
            <div className="text-[11px] text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/50 rounded px-2 py-1.5 flex items-center gap-1.5">
              <Check className="h-3 w-3 flex-shrink-0" />
              {status.location.name}: {status.weather.temperature.toFixed(1)}°C,{' '}
              {Math.round(status.weather.humidity)}% RH,{' '}
              {status.weather.solarRadiation.toFixed(0)} W/m²
            </div>
          )}
          {status.kind === 'error' && (
            <div className="text-[11px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded px-2 py-1.5 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {status.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
