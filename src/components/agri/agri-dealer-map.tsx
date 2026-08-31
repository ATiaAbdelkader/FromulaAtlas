'use client';

/**
 * AgriDealerMap — interactive Leaflet map showing 500+ Algerian agricultural
 * input dealers with GPS nearest-dealer detection.
 *
 * Features:
 *   - Interactive map with OpenStreetMap tiles
 *   - Pins for every dealer (color-coded by category)
 *   - Popups with dealer name, address, phone, WhatsApp
 *   - "Find Nearest" button — uses browser geolocation to find closest dealers
 *   - Distance display (km) from user to each dealer when GPS is active
 *   - Filter by category, INPV verification, search by name/wilaya
 *   - Click any pin to see full dealer card
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Navigation, Search, Filter, Store, Phone, MessageSquare,
  CheckCircle2, ShieldCheck, X, Crosshair, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation, copyFor } from '@/lib/language-store';
import { ALGERIAN_AGRI_STORES, type AgriStore } from '@/lib/algerian-agri-stores-data';
import { cn } from '@/lib/utils';

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category colors for pins
const CATEGORY_COLORS: Record<string, string> = {
  full_service: '#16a34a',     // green
  phyto_chem: '#dc2626',       // red
  bio_inputs: '#84cc16',       // lime
  irrigation_tech: '#0ea5e9',  // sky
  seeds_seedlings: '#f59e0b',  // amber
};

// Create custom colored pin icon
function makePinIcon(color: string, isNearest = false) {
  const size = isNearest ? 32 : 24;
  const anchor = isNearest ? 32 : 24;
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${isNearest ? 'animation: pulse 2s infinite;' : ''}
    "><div style="
      transform: rotate(45deg);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isNearest ? 14 : 10}px;
    ">${isNearest ? '📍' : '🏪'}</div></div>`,
    className: 'custom-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, anchor],
  });
}

// Calculate distance between two lat/lng points (haversine formula)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Component to fly to a specific location on the map
function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.5 });
  }, [lat, lng, zoom, map]);
  return null;
}

export function AgriDealerMap() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedStore, setSelectedStore] = useState<AgriStore | null>(null);
  const [nearestStores, setNearestStores] = useState<{ store: AgriStore; distance: number }[]>([]);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  // Filter stores
  const filteredStores = useMemo(() => {
    return ALGERIAN_AGRI_STORES.filter((store) => {
      const matchSearch =
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.wilaya.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.stockedBrands.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'All' || store.category === selectedCategory;
      const matchVerified = !onlyVerified || store.verifiedInpvDealer;
      return matchSearch && matchCat && matchVerified;
    });
  }, [searchQuery, selectedCategory, onlyVerified]);

  // Stores with distances (if GPS active)
  const storesWithDistances = useMemo(() => {
    if (!userLocation) return filteredStores.map((s) => ({ store: s, distance: Infinity }));
    return filteredStores
      .map((s) => ({ store: s, distance: haversineKm(userLocation.lat, userLocation.lng, s.lat, s.lng) }))
      .sort((a, b) => a.distance - b.distance);
  }, [filteredStores, userLocation]);

  // Find nearest dealers
  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert(tr('Geolocation not supported by your browser', 'المتصفح لا يدعم تحديد الموقع', 'Géolocalisation non supportée'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        // Find nearest 10
        const sorted = ALGERIAN_AGRI_STORES.map((s) => ({
          store: s,
          distance: haversineKm(loc.lat, loc.lng, s.lat, s.lng),
        })).sort((a, b) => a.distance - b.distance);
        setNearestStores(sorted.slice(0, 10));
        // Fly to nearest
        if (sorted[0]) {
          setFlyTo({ lat: sorted[0].store.lat, lng: sorted[0].store.lng, zoom: 11 });
          setSelectedStore(sorted[0].store);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        alert(tr('Could not get your location. Please enable GPS.', 'تعذر الحصول على موقعك. يرجى تفعيل الـ GPS.', "Impossible d'obtenir votre position. Activez le GPS."));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Categories for filter
  const categories = [
    { id: 'All', label: tr('All Categories', 'كل الفئات', 'Toutes catégories') },
    { id: 'full_service', label: tr('Full Service', 'خدمة شاملة', 'Service complet') },
    { id: 'phyto_chem', label: tr('Phytosanitary', 'صحية نباتية', 'Phytosanitaire') },
    { id: 'bio_inputs', label: tr('Bio Inputs', 'مدخلات حيوية', 'Bio-intrants') },
    { id: 'irrigation_tech', label: tr('Irrigation', 'الري', 'Irrigation') },
    { id: 'seeds_seedlings', label: tr('Seeds & Plants', 'بذور وشتلات', 'Semences') },
  ];

  // Center of Algeria
  const defaultCenter: [number, number] = [28.0, 2.0];
  const defaultZoom = 5;

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border bg-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tr('Search dealer, wilaya, or brand…', 'ابحث عن موزع، ولاية، أو علامة…', 'Rechercher distributeur, wilaya, ou marque…')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        <Button
          variant={onlyVerified ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOnlyVerified(!onlyVerified)}
          className="h-9 gap-1.5 text-xs"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {tr('INPV Verified', 'معتمد INPV', 'Homologué INPV')}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleFindNearest}
          disabled={locating}
          className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          {tr('Find Nearest', 'ابحث عن الأقرب', 'Plus proche')}
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="gap-1">
          <Store className="h-3 w-3" />
          {filteredStores.length} {tr('dealers found', 'موزع', 'distributeurs')}
        </Badge>
        {userLocation && (
          <Badge variant="outline" className="gap-1 text-emerald-700">
            <Navigation className="h-3 w-3" />
            {tr('GPS Active', 'GPS مُفعّل', 'GPS actif')}
          </Badge>
        )}
      </div>

      {/* Map + Side panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Map */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border" style={{ height: '500px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* User location circle */}
            {userLocation && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>{tr('Your location', 'موقعك', 'Votre position')}</Popup>
                </Marker>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={5000}
                  pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.1 }}
                />
              </>
            )}

            {/* Dealer pins */}
            {storesWithDistances.map(({ store, distance }) => {
              const isNearest = nearestStores.length > 0 && nearestStores[0]?.store.id === store.id;
              return (
                <Marker
                  key={store.id}
                  position={[store.lat, store.lng]}
                  icon={makePinIcon(CATEGORY_COLORS[store.category] || '#666', isNearest)}
                  eventHandlers={{
                    click: () => {
                      setSelectedStore(store);
                      setFlyTo({ lat: store.lat, lng: store.lng, zoom: 12 });
                    },
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {store.verifiedInpvDealer && '✅ '}
                        {language === 'ar' ? store.name_ar : store.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                        {store.wilaya} — {store.commune}
                      </div>
                      {distance !== Infinity && (
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>
                          📍 {distance} km {tr('away', 'بعيد', 'de distance')}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                        📞 {store.phone}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {store.openingHours}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Fly to selected */}
            {flyTo && <FlyTo lat={flyTo.lat} lng={flyTo.lng} zoom={flyTo.zoom} />}
          </MapContainer>
        </div>

        {/* Side panel — dealer list + selected dealer */}
        <div className="lg:col-span-1 space-y-2 max-h-[500px] overflow-y-auto">
          {/* Selected dealer card */}
          {selectedStore && (
            <Card className="border-emerald-300 dark:border-emerald-800">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1">
                      {selectedStore.verifiedInpvDealer && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      {language === 'ar' ? selectedStore.name_ar : selectedStore.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 inline" /> {selectedStore.wilaya}
                    </div>
                  </div>
                  <button onClick={() => setSelectedStore(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {userLocation && (
                  <Badge variant="outline" className="text-xs gap-1 text-emerald-700">
                    <Navigation className="h-3 w-3" />
                    {haversineKm(userLocation.lat, userLocation.lng, selectedStore.lat, selectedStore.lng)} km
                  </Badge>
                )}

                <div className="text-xs space-y-1">
                  <div className="text-muted-foreground">{selectedStore.address}</div>
                  <div>📞 {selectedStore.phone}</div>
                  <div>🕐 {selectedStore.openingHours}</div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedStore.stockedBrands.slice(0, 4).map((brand) => (
                    <Badge key={brand} variant="secondary" className="text-[9px]">{brand}</Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 flex-1"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedStore.lat},${selectedStore.lng}`, '_blank')}
                  >
                    <Navigation className="h-3 w-3" />
                    {tr('Directions', 'الاتجاهات', 'Itinéraire')}
                  </Button>
                  {selectedStore.whatsappPhone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 flex-1"
                      onClick={() => window.open(`https://wa.me/${selectedStore.whatsappPhone}`, '_blank')}
                    >
                      <MessageSquare className="h-3 w-3" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nearest dealers list (if GPS active) */}
          {nearestStores.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tr('Nearest Dealers', 'أقرب الموزعين', 'Distributeurs les plus proches')}
              </div>
              {nearestStores.map(({ store, distance }, i) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store);
                    setFlyTo({ lat: store.lat, lng: store.lng, zoom: 12 });
                  }}
                  className={cn(
                    'w-full text-start p-2 rounded-lg border text-xs transition-colors',
                    selectedStore?.id === store.id
                      ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-1">
                        {i === 0 && '📍 '}
                        {store.verifiedInpvDealer && '✅ '}
                        {language === 'ar' ? store.name_ar : store.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {store.wilaya}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] font-mono shrink-0', i === 0 && 'border-emerald-400 text-emerald-700')}>
                      {distance} km
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* All dealers list (when no GPS) */}
          {nearestStores.length === 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tr('All Dealers', 'كل الموزعين', 'Tous les distributeurs')} ({storesWithDistances.length})
              </div>
              {storesWithDistances.slice(0, 50).map(({ store }) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store);
                    setFlyTo({ lat: store.lat, lng: store.lng, zoom: 12 });
                  }}
                  className={cn(
                    'w-full text-start p-2 rounded-lg border text-xs transition-colors',
                    selectedStore?.id === store.id
                      ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-1">
                        {store.verifiedInpvDealer && '✅ '}
                        {language === 'ar' ? store.name_ar : store.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {store.wilaya} · {store.category_fr}
                      </div>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[store.category] }}
                    />
                  </div>
                </button>
              ))}
              {storesWithDistances.length > 50 && (
                <div className="text-[10px] text-muted-foreground text-center p-2">
                  {tr(`+${storesWithDistances.length - 50} more dealers`, `+${storesWithDistances.length - 50} موزع آخر`, `+${storesWithDistances.length - 50} autres`)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
