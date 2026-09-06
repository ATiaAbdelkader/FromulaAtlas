'use client';

/**
 * FieldBoundaryMap — lets a farmer draw their field boundary on a map.
 *
 * Uses Leaflet + OpenStreetMap (free, no API key). The farmer:
 *   1. Clicks points on the map to draw a polygon
 *   2. Double-clicks to close the polygon
 *   3. The area is computed automatically (in hectares)
 *   4. The polygon + area are passed to the parent via onChange
 *
 * SSR-safe: the actual Leaflet map is loaded via next/dynamic with
 * { ssr: false } because Leaflet accesses `window` during import.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Trash2, Check, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/language-store';

// ---------------------------------------------------------------------------
// Area computation (pure function — safe to import on server)
// ---------------------------------------------------------------------------

/**
 * Compute the area of a polygon in hectares using the Shoelace formula
 * with spherical Earth approximation.
 */
export function computePolygonAreaHa(points: [number, number][]): number {
  if (points.length < 3) return 0;

  const R = 6371000; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[(i + 1) % points.length];
    const radLat1 = (lat1 * Math.PI) / 180;
    const radLat2 = (lat2 * Math.PI) / 180;
    const deltaLng = ((lng2 - lng1) * Math.PI) / 180;
    area += deltaLng * (2 + Math.sin(radLat1) + Math.sin(radLat2));
  }

  area = Math.abs((area * R * R) / 2);
  return Math.round((area / 10000) * 100) / 100; // m² → ha, 2 decimals
}

// ---------------------------------------------------------------------------
// Props (shared between wrapper + inner component)
// ---------------------------------------------------------------------------

interface FieldBoundaryMapProps {
  center: [number, number];
  onChange?: (points: [number, number][], areaHa: number) => void;
}

// ---------------------------------------------------------------------------
// Inner component — loaded only in browser (SSR disabled)
// ---------------------------------------------------------------------------

function FieldBoundaryMapInner({ center, onChange }: FieldBoundaryMapProps) {
  const { language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const [points, setPoints] = useState<[number, number][]>([]);
  const [isClosed, setIsClosed] = useState(false);

  const areaHa = computePolygonAreaHa(points);

  const handleAddPoint = useCallback((latlng: [number, number]) => {
    if (isClosed) return;
    setPoints(prev => [...prev, latlng]);
  }, [isClosed]);

  const handleClose = useCallback(() => {
    setIsClosed(true);
  }, []);

  const handleReset = useCallback(() => {
    setPoints([]);
    setIsClosed(false);
    onChange?.([], 0);
  }, [onChange]);

  useEffect(() => {
    if (isClosed && points.length >= 3) {
      onChange?.(points, areaHa);
    }
  }, [isClosed, points, areaHa, onChange]);

  // Import Leaflet components lazily (only runs in browser)
  // We use require() inside the component body because next/dynamic
  // can't handle named exports from react-leaflet cleanly
  const { MapContainer, TileLayer, Polygon, CircleMarker, Marker, useMapEvents } = require('react-leaflet');
  const L = require('leaflet');
  require('leaflet/dist/leaflet.css');

  // Fix Leaflet default icon
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  // Click handler (must be inside MapContainer)
  const ClickHandler = ({ points, onAddPoint, onClosePolygon }: {
    points: [number, number][];
    onAddPoint: (latlng: [number, number]) => void;
    onClosePolygon: () => void;
  }) => {
    useMapEvents({
      click(e: { latlng: { lat: number; lng: number } }) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      },
      dblclick() {
        if (points.length >= 3) onClosePolygon();
      },
    });
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: '350px' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler points={points} onAddPoint={handleAddPoint} onClosePolygon={handleClose} />
          {points.length >= 2 && (
            <Polygon
              positions={points}
              pathOptions={{
                color: '#059669',
                fillColor: '#10b981',
                fillOpacity: isClosed ? 0.3 : 0,
                weight: 2,
              }}
            />
          )}
          {points.map((point, i) => (
            <CircleMarker
              key={i}
              center={point}
              radius={5}
              pathOptions={{ color: '#059669', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
            />
          ))}
          <Marker position={center} />
        </MapContainer>

        {/* Instructions overlay */}
        <div className="absolute top-2 left-2 right-2 z-[1000] pointer-events-none">
          <div className="inline-block rounded-lg bg-background/90 backdrop-blur px-3 py-1.5 text-xs shadow-md">
            {!isClosed ? (
              <span>
                {points.length === 0
                  ? t('Click to add field corners', 'انقر لإضافة زوايا الحقل', 'Cliquez pour les coins')
                  : points.length < 3
                    ? t(`${points.length} pts — need 3+`, `${points.length} نقاط — تحتاج 3+`, `${points.length} pts — min 3`)
                    : t(`${points.length} pts — double-click to close`, `${points.length} نقاط — نقر مزدوج للإغلاق`, `${points.length} pts — dbl-clic pour fermer`)}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">✓ {t('Boundary drawn', 'تم رسم الحدود', 'Limites tracées')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Area + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Ruler className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">
            {areaHa > 0 ? `${areaHa} ha` : t('Draw to compute area', 'ارسم لحساب المساحة', 'Dessinez pour calculer')}
          </span>
        </div>
        <div className="flex gap-2">
          {points.length >= 3 && !isClosed && (
            <Button size="sm" variant="default" onClick={handleClose}>
              <Check className="h-3.5 w-3.5" />
              {t('Close', 'إغلاق', 'Fermer')}
            </Button>
          )}
          {points.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleReset}>
              <Trash2 className="h-3.5 w-3.5" />
              {t('Reset', 'مسح', 'Effacer')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export — SSR-safe wrapper
// ---------------------------------------------------------------------------

/**
 * SSR-safe field boundary map. The actual Leaflet component is loaded
 * only in the browser via next/dynamic.
 */
export const FieldBoundaryMap = dynamic(
  () => Promise.resolve(FieldBoundaryMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[350px] rounded-xl border border-border bg-muted/20">
        <span className="text-sm text-muted-foreground">Loading map…</span>
      </div>
    ),
  },
);
