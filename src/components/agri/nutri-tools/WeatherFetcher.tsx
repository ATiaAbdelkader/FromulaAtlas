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
  RotateCcw,
} from 'lucide-react';
import {
  fetchCurrentWeather,
  fetchDailyEto,
  searchCities,
  type CurrentWeather,
  type DailyEto,
  type GeoLocation,
} from '@/lib/open-meteo';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

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

const TITLE: TrilingualString = {
  en: 'Live Weather',
  ar: 'الطقس المباشر',
  fr: 'Météo en direct',
};

const DESC: TrilingualString = {
  en: 'Pick a location (city search or GPS) and fetch live weather from the free Open-Meteo API.',
  ar: 'اختر موقعاً (بحث مدينة أو GPS) واحصل على بيانات الطقس المباشرة من واجهة Open-Meteo المجانية.',
  fr: 'Choisissez un lieu (recherche ville ou GPS) et récupérez la météo en direct via l\'API gratuite Open-Meteo.',
};

/**
 * Live weather picker panel — lets a user pick a location (city search with
 * autocomplete, or GPS) and fetch live weather from the free Open-Meteo API.
 *
 * - All network calls happen client-side; no server routes involved.
 * - On success, calls `onWeather` (always) and `onEto` (irrigation variant
 *   only) with the parsed payloads.
 */
export function WeatherFetcher({ onWeather, onEto, variant }: WeatherFetcherProps) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

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
        message: tr('Geolocation is not available in this browser.', 'خدمة تحديد الموقع غير متاحة في هذا المتصفح.', 'La géolocalisation n\'est pas disponible dans ce navigateur.'),
      });
      return;
    }
    setStatus({
      kind: 'fetching',
      location: { lat: 0, lng: 0, name: tr('Locating…', 'جارٍ التحديد…', 'Localisation…'), country: '' },
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
            ? tr('Location access denied. Enter a city instead.', 'تم رفض الوصول للموقع. أدخل مدينة بدلاً من ذلك.', 'Accès à la localisation refusé. Saisissez une ville.')
            : tr('Could not get your location. Enter a city instead.', 'تعذّر الحصول على موقعك. أدخل مدينة بدلاً من ذلك.', 'Impossible d\'obtenir votre position. Saisissez une ville.');
        setStatus({ kind: 'error', message: msg });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }, [tr]);

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
          message: tr('Failed to fetch weather. Check your connection.', 'فشل في جلب بيانات الطقس. تحقق من اتصالك.', 'Échec de récupération météo. Vérifiez votre connexion.'),
        });
        return;
      }
      onWeather(weather, location);
      if (eto && onEto) onEto(eto, location);
      setStatus({ kind: 'success', weather, location });
    } catch {
      setStatus({
        kind: 'error',
        message: tr('Failed to fetch weather. Check your connection.', 'فشل في جلب بيانات الطقس. تحقق من اتصالك.', 'Échec de récupération météo. Vérifiez votre connexion.'),
      });
    }
  }, [location, variant, onWeather, onEto]);

  const reset = () => {
    setQuery('');
    setSuggestions([]);
    setSearching(false);
    setShowDropdown(false);
    setNoMatches(false);
    setLocation(null);
    setStatus({ kind: 'idle' });
    toast({ title: tr('Reset', 'إعادة تعيين', 'Réinitialisé') });
  };

  const successWeather = status.kind === 'success' ? status.weather : null;
  const successLocation = status.kind === 'success' ? status.location : null;

  return (
    <CalculatorShell
      icon={CloudSun}
      title={TITLE}
      description={DESC}
      accent="sky"
      badge={variant === 'irrigation' ? tr('Irrigation mode', 'وضع الري', 'Mode irrigation') : tr('VPD mode', 'وضع VPD', 'Mode VPD')}
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: reset,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              {tr('Pick a location', 'اختر موقعاً', 'Choisir un lieu')}
            </span>
            {location && (
              <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
                {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
              </span>
            )}
          </div>

          {/* City search with autocomplete dropdown */}
          <div className="relative">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
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
                placeholder={tr('Search city…', 'ابحث عن مدينة…', 'Rechercher une ville…')}
                className="h-9 pl-8 text-sm"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
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
                {tr('No matching cities found.', 'لا توجد مدن مطابقة.', 'Aucune ville correspondante.')}
              </div>
            )}
          </div>

          {/* GPS button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useGps}
            className="w-full h-9 text-xs border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-100/60 dark:hover:bg-sky-950/40"
          >
            <Crosshair className="h-3.5 w-3.5 mr-1.5" />
            {tr('Use my GPS', 'استخدم GPS', 'Utiliser mon GPS')}
          </Button>

          {/* Selected location + Fetch button */}
          {location && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3 w-3 flex-shrink-0 text-sky-600 dark:text-sky-400" />
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
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white"
              >
                {status.kind === 'fetching' ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <CloudSun className="h-3.5 w-3.5 mr-1" />
                )}
                {tr('Fetch weather', 'اجلب الطقس', 'Récupérer')}
              </Button>
            </div>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3 h-full">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-sky-50 via-transparent to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              🛰️ {tr('Weather Status', 'حالة الطقس', 'État météo')}
            </span>
            {successWeather && (
              <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
                {successWeather.temperature.toFixed(1)}°C
              </span>
            )}
          </div>

          {/* Status banners */}
          {status.kind === 'fetching' && (
            <div className="text-[11px] text-sky-800 dark:text-sky-200 bg-sky-100 dark:bg-sky-950/50 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              {tr('Fetching weather for', 'جلب الطقس لـ', 'Récupération météo pour')} {status.location.name}…
            </div>
          )}
          {status.kind === 'error' && (
            <div className="text-[11px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {status.message}
            </div>
          )}

          {/* Success: weather metrics */}
          {successWeather && successLocation ? (
            <>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                <Check className="h-3 w-3 flex-shrink-0" />
                {successLocation.name}
                {successLocation.country && <span> · {successLocation.country}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CalculatorShell.MetricTile
                  label={tr('Temperature', 'درجة الحرارة', 'Température')}
                  value={successWeather.temperature.toFixed(1)}
                  unit="°C"
                  color="sky"
                  helper={tr('air temperature', 'حرارة الهواء', 'température air')}
                />
                <CalculatorShell.MetricTile
                  label={tr('Humidity', 'الرطوبة', 'Humidité')}
                  value={Math.round(successWeather.humidity)}
                  unit="%"
                  color="teal"
                  helper={tr('relative humidity', 'رطوبة نسبية', 'humidité relative')}
                />
                <CalculatorShell.MetricTile
                  label={tr('Solar radiation', 'الإشعاع الشمسي', 'Rayonnement solaire')}
                  value={successWeather.solarRadiation.toFixed(0)}
                  unit="W/m²"
                  color="amber"
                  helper={tr('global radiation', 'إشعاع إجمالي', 'rayonnement global')}
                />
                {successWeather.uvIndex != null && (
                  <CalculatorShell.MetricTile
                    label={tr('UV index', 'مؤشر الأشعة فوق البنفسجية', 'Indice UV')}
                    value={successWeather.uvIndex.toFixed(1)}
                    color="default"
                    helper={tr('UVI at ground level', 'مؤشر UVI على سطح الأرض', 'UVI au niveau du sol')}
                  />
                )}
              </div>
              <div className="text-[10px] text-muted-foreground text-center pt-1">
                {tr('Data source: Open-Meteo (free, no API key required)', 'المصدر: Open-Meteo (مجاني، بدون مفتاح API)', 'Source : Open-Meteo (gratuit, sans clé API)')}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CloudSun className="h-10 w-10 mx-auto text-sky-300 dark:text-sky-700 mb-2" />
              <div className="text-xs">
                {tr('Search a city or use GPS, then click "Fetch weather" to see live conditions.', 'ابحث عن مدينة أو استخدم GPS، ثم اضغط "اجلب الطقس" لعرض الحالة المباشرة.', 'Recherchez une ville ou utilisez le GPS, puis cliquez sur « Récupérer » pour voir les conditions en direct.')}
              </div>
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
