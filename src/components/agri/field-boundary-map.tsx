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
 * This replaces the manual "enter your area in hectares" text field —
 * much more intuitive for farmers who know their field by sight.
 *
 * No Python microservice needed — all computation is client-side.
 * For auto-detection from satellite (agribound), that would need a
 * Python backend — deferred until we have 500+ users.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MapContainer, TileLayer, Polygon, useMapEvents, Marker, CircleMarker,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Trash2, Check, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/language-store';

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface FieldBoundaryMapProps {
  /** Initial center [lat, lng] — typically from farm profile. */
  center: [number, number];
  /** Called when the polygon is closed with the points + computed area. */
  onChange?: (points: [number, number][], areaHa: number) => void;
}

// ---------------------------------------------------------------------------
// Click handler component (must be inside MapContainer)
// ---------------------------------------------------------------------------

function ClickHandler({
  points,
  onAddPoint,
  onClosePolygon,
}: {
  points: [number, number][];
  onAddPoint: (latlng: [number, number]) => void;
  onClosePolygon: () => void;
}) {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
    dblclick() {
      if (points.length >= 3) {
        onClosePolygon();
      }
    },
  });
  return null;
}

// ---------------------------------------------------------------------------
// Area computation (Shoelace formula on geographic coordinates)
// ---------------------------------------------------------------------------

/**
 * Compute the area of a polygon in hectares using the Shoelace formula
 * with spherical Earth approximation.
 *
 * @param points Array of [lat, lng] pairs
 * @returns Area in hectares
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
// Main component
// ---------------------------------------------------------------------------

export function FieldBoundaryMap({ center, onChange }: FieldBoundaryMapProps) {
  const { language, isRTL } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const [points, setPoints] = useState<[number, number][]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const areaHa = computePolygonAreaHa(points);

  const handleAddPoint = useCallback((latlng: [number, number]) => {
    if (isClosed) return;  // can't add points after closing
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

  // Notify parent when polygon is closed
  useEffect(() => {
    if (isClosed && points.length >= 3) {
      onChange?.(points, areaHa);
    }
  }, [isClosed, points, areaHa, onChange]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: '350px' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          ref={(map) => { mapRef.current = map; }}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler
            points={points}
            onAddPoint={handleAddPoint}
            onClosePolygon={handleClose}
          />

          {/* Draw the polygon (or polyline if not closed) */}
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

          {/* Draw markers at each point */}
          {points.map((point, i) => (
            <CircleMarker
              key={i}
              center={point}
              radius={5}
              pathOptions={{
                color: '#059669',
                fillColor: '#fff',
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}

          {/* Center marker (farm location) */}
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
                    ? t(`${points.length} points — need at least 3`, `${points.length} نقاط — تحتاج 3 على الأقل`, `${points.length} points — min 3`)
                    : t(`${points.length} points — double-click to close`, `${points.length} نقاط — انقر مزدوج للإغلاق`, `${points.length} points — double-clic pour fermer`)}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">
                ✓ {t('Field boundary drawn', 'تم رسم حدود الحقل', 'Limites tracées')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Area + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Ruler className="h-4 w-4 text-emerald-600" />
          <span className="font-medium">
            {areaHa > 0
              ? `${areaHa} ha`
              : t('Draw your field to compute area', 'ارسم حقلك لحساب المساحة', 'Dessinez pour calculer')}
          </span>
        </div>
        <div className="flex gap-2">
          {points.length >= 3 && !isClosed && (
            <Button size="sm" variant="default" onClick={handleClose}>
              <Check className="h-3.5 w-3.5" />
              {t('Close boundary', 'إغلاق الحدود', 'Fermer')}
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
