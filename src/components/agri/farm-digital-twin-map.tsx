'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  MapPin,
  Layers,
  Mountain,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
  Droplets,
  Activity,
  Sprout,
  ShieldAlert,
  Sun,
  FileCode,
  Download,
  Check,
  ChevronRight,
  Info,
  Sliders,
  Move
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import {
  type DigitalTwinFieldSnapshot,
  type DigitalTwinSnapshot,
  type SavedFieldRecord,
} from '@/lib/farm-digital-twin';
import { ringArea, ringPerimeter, ringCentroid, bbox, haversine, type Ring, type Boundary } from '@/lib/field-boundary';
import { toast } from '@/hooks/use-toast';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type MapLayerMode = 'parcels' | 'ndvi' | 'irrigation' | 'soil' | 'satellite';

export interface FieldGeoPolygon {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  healthScore: number;
  waterDemandLevel: 'low' | 'medium' | 'high';
  soilTexture: string;
  avgElevationM: number;
  slopePct: number;
  coordinates: Ring; // [lng, lat][] in degrees
  color: string;
  kc: number;
  alertsCount: number;
  ndviAverage: number;
}

export interface FarmPresetRegion {
  id: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  region: string;
  centerLng: number;
  centerLat: number;
  baseElevationM: number;
  climateZone: string;
  fields: Array<{
    name: string;
    crop: string;
    areaHa: number;
    healthScore: number;
    waterDemandLevel: 'low' | 'medium' | 'high';
    soilTexture: string;
    elevationOffsetM: number;
    slopePct: number;
    relativePolygon: [number, number][]; // normalized offsets from center
    color: string;
    kc: number;
    alertsCount: number;
    ndviAverage: number;
  }>;
}

// ---------------------------------------------------------------------------
// Algerian Regional Farm Presets
// ---------------------------------------------------------------------------

const ALGERIA_FARM_PRESETS: FarmPresetRegion[] = [
  {
    id: 'mitidja-horticulture',
    nameEn: 'Mitidja Valley Horticultural Farm (Blida)',
    nameAr: 'مزرعة الخضراوات والحمضيات بسهل متيجة (البليدة)',
    nameFr: 'Exploitation Horticole de la Mitidja (Blida)',
    region: 'Blida / Boufarik',
    centerLng: 2.9142,
    centerLat: 36.5758,
    baseElevationM: 145,
    climateZone: 'Sub-humid Coastal Tell',
    fields: [
      {
        name: 'Parcelle Nord - Agrumes (Clémentinier)',
        crop: 'citrus',
        areaHa: 4.8,
        healthScore: 92,
        waterDemandLevel: 'medium',
        soilTexture: 'Alluvial Loam',
        elevationOffsetM: 2,
        slopePct: 1.2,
        relativePolygon: [
          [-0.0035, 0.0018],
          [0.0005, 0.0022],
          [0.0012, 0.0002],
          [-0.0031, -0.0003],
          [-0.0035, 0.0018],
        ],
        color: '#10b981',
        kc: 0.75,
        alertsCount: 0,
        ndviAverage: 0.78,
      },
      {
        name: 'Parcelle Est - Tomate Maraîchère',
        crop: 'tomato',
        areaHa: 2.6,
        healthScore: 84,
        waterDemandLevel: 'high',
        soilTexture: 'Clay Loam',
        elevationOffsetM: -1,
        slopePct: 0.8,
        relativePolygon: [
          [0.0008, 0.0021],
          [0.0042, 0.0019],
          [0.0039, -0.0008],
          [0.0011, -0.0002],
          [0.0008, 0.0021],
        ],
        color: '#f43f5e',
        kc: 1.15,
        alertsCount: 1,
        ndviAverage: 0.82,
      },
      {
        name: 'Parcelle Sud - Pomme de Terre Primeur',
        crop: 'potato',
        areaHa: 3.5,
        healthScore: 78,
        waterDemandLevel: 'high',
        soilTexture: 'Sandy Clay Loam',
        elevationOffsetM: 4,
        slopePct: 1.8,
        relativePolygon: [
          [-0.0028, -0.0005],
          [0.0009, -0.0004],
          [0.0005, -0.0026],
          [-0.0034, -0.0024],
          [-0.0028, -0.0005],
        ],
        color: '#eab308',
        kc: 0.95,
        alertsCount: 2,
        ndviAverage: 0.69,
      },
      {
        name: 'Parcelle Sud-Est - Fraisier Hors-Sol & Sol',
        crop: 'strawberry',
        areaHa: 1.9,
        healthScore: 88,
        waterDemandLevel: 'medium',
        soilTexture: 'Siliceous Sandy Loam',
        elevationOffsetM: 1,
        slopePct: 0.5,
        relativePolygon: [
          [0.0012, -0.0005],
          [0.0041, -0.001],
          [0.0038, -0.0028],
          [0.0008, -0.0027],
          [0.0012, -0.0005],
        ],
        color: '#ec4899',
        kc: 0.85,
        alertsCount: 0,
        ndviAverage: 0.74,
      },
    ],
  },
  {
    id: 'setif-cereals',
    nameEn: 'High Plateaus Cereal & Forage Estate (Sétif)',
    nameAr: 'مستثمرة الحبوب والأعلاف بالهضاب العليا (سطيف)',
    nameFr: 'Domaine Céréalier des Hauts Plateaux (Sétif)',
    region: 'Sétif / El Eulma',
    centerLng: 5.4055,
    centerLat: 36.1911,
    baseElevationM: 1040,
    climateZone: 'Semi-arid Continental Plateau',
    fields: [
      {
        name: 'Grand Champ - Blé Dur (Cirta)',
        crop: 'wheat',
        areaHa: 18.5,
        healthScore: 86,
        waterDemandLevel: 'low',
        soilTexture: 'Calcareous Clay',
        elevationOffsetM: 12,
        slopePct: 3.5,
        relativePolygon: [
          [-0.006, 0.004],
          [0.002, 0.0045],
          [0.0015, -0.001],
          [-0.0055, -0.0015],
          [-0.006, 0.004],
        ],
        color: '#d97706',
        kc: 0.65,
        alertsCount: 0,
        ndviAverage: 0.64,
      },
      {
        name: 'Champs Sud - Orge Fourragère',
        crop: 'barley',
        areaHa: 12.2,
        healthScore: 79,
        waterDemandLevel: 'low',
        soilTexture: 'Silt Loam',
        elevationOffsetM: 6,
        slopePct: 2.1,
        relativePolygon: [
          [-0.005, -0.002],
          [0.0018, -0.0015],
          [0.0012, -0.006],
          [-0.0058, -0.0055],
          [-0.005, -0.002],
        ],
        color: '#ca8a04',
        kc: 0.55,
        alertsCount: 1,
        ndviAverage: 0.58,
      },
      {
        name: 'Parcelle Pivot - Luzerne Irriguée (Pivot 1)',
        crop: 'alfalfa',
        areaHa: 8.0,
        healthScore: 94,
        waterDemandLevel: 'high',
        soilTexture: 'Clay Loam',
        elevationOffsetM: 0,
        slopePct: 0.9,
        relativePolygon: [
          [0.0025, 0.003],
          [0.0075, 0.0028],
          [0.007, -0.003],
          [0.0022, -0.0025],
          [0.0025, 0.003],
        ],
        color: '#15803d',
        kc: 1.1,
        alertsCount: 0,
        ndviAverage: 0.86,
      },
    ],
  },
  {
    id: 'biskra-oasis',
    nameEn: 'Zibans Greenhouse & Date Palm Oasis (Biskra)',
    nameAr: 'واحة الزيبان للبيوت المحمية والنخيل (بسكرة)',
    nameFr: 'Oasis Sous-Serres & Phoenicicole des Zibans (Biskra)',
    region: 'Biskra / Sidi Okba',
    centerLng: 5.7289,
    centerLat: 34.8504,
    baseElevationM: 92,
    climateZone: 'Hyper-arid Saharan Oasis',
    fields: [
      {
        name: 'Palmeraie Deglet Nour - Secteur Goutte-à-Goutte',
        crop: 'date_palm',
        areaHa: 6.4,
        healthScore: 91,
        waterDemandLevel: 'medium',
        soilTexture: 'Gypsiferous Sandy Loam',
        elevationOffsetM: 0,
        slopePct: 0.4,
        relativePolygon: [
          [-0.004, 0.003],
          [0.001, 0.0032],
          [0.0008, -0.0015],
          [-0.0042, -0.0012],
          [-0.004, 0.003],
        ],
        color: '#059669',
        kc: 0.8,
        alertsCount: 0,
        ndviAverage: 0.72,
      },
      {
        name: 'Complexe Serres Multi-Chapelles - Tomate & Poivron',
        crop: 'tomato',
        areaHa: 3.2,
        healthScore: 95,
        waterDemandLevel: 'high',
        soilTexture: 'Sandy Loam Drip Fertigated',
        elevationOffsetM: 1,
        slopePct: 0.2,
        relativePolygon: [
          [0.0015, 0.003],
          [0.0055, 0.0028],
          [0.0052, -0.001],
          [0.0012, -0.0008],
          [0.0015, 0.003],
        ],
        color: '#dc2626',
        kc: 1.2,
        alertsCount: 0,
        ndviAverage: 0.88,
      },
      {
        name: 'Plein Champ - Melon & Pastèque Précoce',
        crop: 'watermelon',
        areaHa: 4.5,
        healthScore: 76,
        waterDemandLevel: 'high',
        soilTexture: 'Sandy Coarse Soil',
        elevationOffsetM: -2,
        slopePct: 0.6,
        relativePolygon: [
          [-0.0035, -0.002],
          [0.0045, -0.0018],
          [0.0038, -0.005],
          [-0.004, -0.0048],
          [-0.0035, -0.002],
        ],
        color: '#16a34a',
        kc: 1.05,
        alertsCount: 2,
        ndviAverage: 0.66,
      },
    ],
  },
  {
    id: 'mostaganem-potato',
    nameEn: 'Mostaganem Potato & Citrus Coastal Plateau',
    nameAr: 'هضبة مستغانم الساحلية للبطاطا والحمضيات',
    nameFr: 'Plateau Côtier de Mostaganem (Pomme de Terre & Agrumes)',
    region: 'Mostaganem / Sayada',
    centerLng: 0.0892,
    centerLat: 35.9312,
    baseElevationM: 115,
    climateZone: 'Maritime Semi-arid Coastal',
    fields: [
      {
        name: 'Parcelle Pivot 1 - Pomme de Terre Arrière-Saison',
        crop: 'potato',
        areaHa: 7.2,
        healthScore: 87,
        waterDemandLevel: 'high',
        soilTexture: 'Sandy Red Loam',
        elevationOffsetM: 3,
        slopePct: 1.5,
        relativePolygon: [
          [-0.004, 0.0035],
          [0.0015, 0.0032],
          [0.001, -0.0012],
          [-0.0045, -0.0008],
          [-0.004, 0.0035],
        ],
        color: '#eab308',
        kc: 1.05,
        alertsCount: 1,
        ndviAverage: 0.77,
      },
      {
        name: 'Verger Nord - Orangerie Navel & Thomson',
        crop: 'citrus',
        areaHa: 5.5,
        healthScore: 90,
        waterDemandLevel: 'medium',
        soilTexture: 'Loam Sub-alkaline',
        elevationOffsetM: 7,
        slopePct: 2.2,
        relativePolygon: [
          [0.002, 0.003],
          [0.0065, 0.0025],
          [0.006, -0.0018],
          [0.0018, -0.0015],
          [0.002, 0.003],
        ],
        color: '#f97316',
        kc: 0.7,
        alertsCount: 0,
        ndviAverage: 0.81,
      },
    ],
  },
];

// Helper to convert crops to standard color palette
const CROP_COLOR_MAP: Record<string, string> = {
  tomato: '#f43f5e',
  potato: '#eab308',
  wheat: '#d97706',
  barley: '#ca8a04',
  citrus: '#f97316',
  olive: '#65a30d',
  grapevine: '#8b5cf6',
  date_palm: '#059669',
  strawberry: '#ec4899',
  maize: '#eab308',
  alfalfa: '#15803d',
  watermelon: '#16a34a',
  default: '#0ea5e9',
};

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

interface FarmDigitalTwinMapProps {
  snapshot?: DigitalTwinSnapshot;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  onOpenFarmTool?: (storageKey: string) => void;
  className?: string;
}

export function FarmDigitalTwinMap({
  snapshot,
  selectedFieldId,
  onSelectField,
  onOpenFarmTool,
  className = '',
}: FarmDigitalTwinMapProps) {
  const { language, isRTL } = useTranslation();

  // State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mitidja-horticulture');
  const [layerMode, setLayerMode] = useState<MapLayerMode>('parcels');
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showFieldLabels, setShowFieldLabels] = useState<boolean>(true);
  const [showCentroidPins, setShowCentroidPins] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showSlopeVectors, setShowSlopeVectors] = useState<boolean>(false);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [boundaryHoverTooltip, setBoundaryHoverTooltip] = useState<{
    x: number;
    y: number;
    field: FieldGeoPolygon;
    displayAreaHa: number;
    displayPerimeterM: number;
  } | null>(null);

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorGeo, setCursorGeo] = useState<{ lng: number; lat: number; elev: number } | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Current Preset Region
  const activePreset = useMemo(() => {
    return ALGERIA_FARM_PRESETS.find((p) => p.id === selectedPresetId) ?? ALGERIA_FARM_PRESETS[0];
  }, [selectedPresetId]);

  // Build Field Geometries (Combining saved user fields or active Algeria preset)
  const mapFields: FieldGeoPolygon[] = useMemo(() => {
    // If user has saved fields in snapshot with areaHa > 0, generate mapped polygons for them
    const userFields = snapshot?.fields ?? [];
    if (userFields.length > 0) {
      const centerLng = activePreset.centerLng;
      const centerLat = activePreset.centerLat;
      const baseElev = activePreset.baseElevationM;

      return userFields.map((fieldSnap, index) => {
        const field = fieldSnap.field;
        const cropKey = field.crop.toLowerCase();
        const color = CROP_COLOR_MAP[cropKey] ?? CROP_COLOR_MAP.default;

        // Spread fields systematically around center
        const row = Math.floor(index / 2);
        const col = index % 2;
        const widthDeg = 0.0035 * Math.sqrt(Math.max(1, field.areaHa) / 3);
        const heightDeg = 0.0025 * Math.sqrt(Math.max(1, field.areaHa) / 3);

        const xMin = (col === 0 ? -widthDeg * 1.1 : 0.0005) - (row * 0.0004);
        const xMax = xMin + widthDeg;
        const yMin = (row === 0 ? 0.0005 : -heightDeg * 1.2 * row);
        const yMax = yMin + heightDeg;

        const coords: Ring = [
          [centerLng + xMin, centerLat + yMax],
          [centerLng + xMax, centerLat + yMax * 0.98],
          [centerLng + xMax * 0.95, centerLat + yMin],
          [centerLng + xMin * 0.98, centerLat + yMin * 1.02],
          [centerLng + xMin, centerLat + yMax],
        ];

        return {
          id: field.id,
          name: field.name,
          crop: field.crop,
          areaHa: field.areaHa,
          healthScore: fieldSnap.healthScore,
          waterDemandLevel: fieldSnap.workbench.irrigation?.level ?? 'medium',
          soilTexture: field.soil.texture || 'Loam',
          avgElevationM: baseElev + (index * 3) - 2,
          slopePct: 1.2 + (index * 0.4),
          coordinates: coords,
          color,
          kc: fieldSnap.workbench.irrigation?.kc ?? 0.85,
          alertsCount: fieldSnap.priorityCount,
          ndviAverage: fieldSnap.satellite?.averageNdvi ?? (0.65 + (fieldSnap.healthScore / 300)),
        };
      });
    }

    // Default to Active Algeria Preset
    return activePreset.fields.map((f, i) => {
      const coords: Ring = f.relativePolygon.map(([dx, dy]) => [
        activePreset.centerLng + dx,
        activePreset.centerLat + dy,
      ]);
      return {
        id: `preset-field-${i + 1}`,
        name: f.name,
        crop: f.crop,
        areaHa: f.areaHa,
        healthScore: f.healthScore,
        waterDemandLevel: f.waterDemandLevel,
        soilTexture: f.soilTexture,
        avgElevationM: activePreset.baseElevationM + f.elevationOffsetM,
        slopePct: f.slopePct,
        coordinates: coords,
        color: f.color,
        kc: f.kc,
        alertsCount: f.alertsCount,
        ndviAverage: f.ndviAverage,
      };
    });
  }, [snapshot, activePreset]);

  // Active highlighted field
  const highlightedField = useMemo(() => {
    if (hoveredFieldId) {
      return mapFields.find((f) => f.id === hoveredFieldId) ?? null;
    }
    if (selectedFieldId) {
      return mapFields.find((f) => f.id === selectedFieldId) ?? null;
    }
    return mapFields[0] ?? null;
  }, [hoveredFieldId, selectedFieldId, mapFields]);

  // Overall Geospatial Bounds
  const overallBbox = useMemo(() => {
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;

    mapFields.forEach((field) => {
      field.coordinates.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
    });

    if (!Number.isFinite(minLng)) {
      minLng = activePreset.centerLng - 0.005;
      maxLng = activePreset.centerLng + 0.005;
      minLat = activePreset.centerLat - 0.005;
      maxLat = activePreset.centerLat + 0.005;
    }

    // Add 15% margin padding around bounding box
    const padLng = (maxLng - minLng) * 0.18 || 0.001;
    const padLat = (maxLat - minLat) * 0.18 || 0.001;

    return {
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
    };
  }, [mapFields, activePreset]);

  // SVG Canvas dimensions
  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 560;

  // Project [lng, lat] to SVG coordinates [x, y]
  const projectToSvg = useCallback(
    (lng: number, lat: number): [number, number] => {
      const { minLng, maxLng, minLat, maxLat } = overallBbox;
      const normX = (lng - minLng) / (maxLng - minLng || 1);
      const normY = (lat - minLat) / (maxLat - minLat || 1);

      // SVG y is inverted (lat increases upwards, svg y increases downwards)
      const x = normX * SVG_WIDTH;
      const y = (1 - normY) * SVG_HEIGHT;
      return [x, y];
    },
    [overallBbox]
  );

  // Convert SVG [x, y] to [lng, lat]
  const unprojectFromSvg = useCallback(
    (x: number, y: number): [number, number] => {
      const { minLng, maxLng, minLat, maxLat } = overallBbox;
      const normX = x / SVG_WIDTH;
      const normY = 1 - y / SVG_HEIGHT;
      const lng = minLng + normX * (maxLng - minLng);
      const lat = minLat + normY * (maxLat - minLat);
      return [lng, lat];
    },
    [overallBbox]
  );

  // Field Polygons SVG Paths & Centroids
  const svgPolygons = useMemo(() => {
    return mapFields.map((field) => {
      const svgPoints = field.coordinates.map(([lng, lat]) => projectToSvg(lng, lat));
      const pathString =
        svgPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ') +
        ' Z';

      // Centroid
      const [cLng, cLat] = ringCentroid(field.coordinates);
      const [cX, cY] = projectToSvg(cLng, cLat);

      // Perimeter & Area calculations
      const calculatedAreaHa = ringArea(field.coordinates) / 10000;
      const calculatedPerimeterM = ringPerimeter(field.coordinates);

      return {
        field,
        pathString,
        svgPoints,
        centroid: { lng: cLng, lat: cLat, x: cX, y: cY },
        displayAreaHa: field.areaHa || Math.max(0.1, Math.round(calculatedAreaHa * 10) / 10),
        displayPerimeterM: Math.round(calculatedPerimeterM),
      };
    });
  }, [mapFields, projectToSvg]);

  // Elevation Contours Simulation Lines across Bounding Box
  const elevationContours = useMemo(() => {
    const lines: Array<{ path: string; elevationM: number; label: string }> = [];
    const baseElev = activePreset.baseElevationM;

    // Generate 7 soft topographic contour isolines across the farm slope
    for (let i = 0; i < 7; i++) {
      const factor = i / 6;
      const elevation = Math.round(baseElev - 10 + i * 5);
      const startY = SVG_HEIGHT * (0.15 + factor * 0.7);

      // Organic curved contour line
      const p0 = [0, startY + Math.sin(i * 1.5) * 20];
      const p1 = [SVG_WIDTH * 0.33, startY + Math.cos(i * 1.8) * 28 + (i % 2 === 0 ? 12 : -10)];
      const p2 = [SVG_WIDTH * 0.66, startY - Math.sin(i * 2.1) * 25 - (i % 2 === 0 ? 15 : -8)];
      const p3 = [SVG_WIDTH, startY + Math.cos(i * 1.2) * 18];

      const path = `M ${p0[0]} ${p0[1].toFixed(1)} C ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}, ${p3[0]} ${p3[1].toFixed(1)}`;
      lines.push({ path, elevationM: elevation, label: `${elevation}m` });
    }

    return lines;
  }, [activePreset, SVG_WIDTH, SVG_HEIGHT]);

  // Mouse Handlers for Pan & Coordinate Tracking
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const rawY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      if (rawX >= 0 && rawX <= SVG_WIDTH && rawY >= 0 && rawY <= SVG_HEIGHT) {
        const [lng, lat] = unprojectFromSvg(rawX, rawY);
        // Approximate elevation based on position in slope
        const elev = Math.round(activePreset.baseElevationM + (1 - rawY / SVG_HEIGHT) * 20 - 10);
        setCursorGeo({ lng, lat, elev });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoomLevel((z) => Math.min(3.5, Math.round((z + 0.25) * 100) / 100));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.75, Math.round((z - 0.25) * 100) / 100));

  // Copy or Export Coordinates
  const handleExportGeoJson = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: mapFields.map((f) => ({
        type: 'Feature',
        properties: {
          id: f.id,
          name: f.name,
          crop: f.crop,
          areaHa: f.areaHa,
          healthScore: f.healthScore,
          elevationM: f.avgElevationM,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [f.coordinates],
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-digital-twin-boundaries-${activePreset.id}.geojson`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: copyFor(language, 'GeoJSON Boundaries Exported', 'تم تصدير حدود الحقول بتنسيق GeoJSON', 'Limites GeoJSON exportées'),
      description: copyFor(
        language,
        `Exported ${mapFields.length} field parcels with WGS84 coordinates.`,
        `تم تصدير ${mapFields.length} قطع حقول بإحداثيات WGS84.`,
        `${mapFields.length} parcelles exportées avec coordonnées WGS84.`
      ),
    });
  };

  // Color generator based on current layer mode
  const getFieldFillColor = (f: FieldGeoPolygon, isSelected: boolean, isHovered: boolean) => {
    let baseColor = f.color;

    if (layerMode === 'ndvi') {
      if (f.ndviAverage >= 0.8) baseColor = '#15803d'; // Rich green
      else if (f.ndviAverage >= 0.7) baseColor = '#22c55e'; // Good green
      else if (f.ndviAverage >= 0.55) baseColor = '#eab308'; // Moderate yellow
      else baseColor = '#ef4444'; // Stressed red
    } else if (layerMode === 'irrigation') {
      if (f.waterDemandLevel === 'high') baseColor = '#0284c7'; // Deep blue
      else if (f.waterDemandLevel === 'medium') baseColor = '#38bdf8'; // Sky blue
      else baseColor = '#93c5fd'; // Light cyan
    } else if (layerMode === 'soil') {
      if (f.soilTexture.toLowerCase().includes('clay')) baseColor = '#b45309';
      else if (f.soilTexture.toLowerCase().includes('sand')) baseColor = '#d97706';
      else baseColor = '#059669';
    } else if (layerMode === 'satellite') {
      baseColor = '#334155';
    }

    const opacity = isSelected ? '0.65' : isHovered ? '0.5' : '0.35';
    return { color: baseColor, fillOpacity: opacity };
  };

  return (
    <Card className={`overflow-hidden border-emerald-200/80 bg-gradient-to-b from-card via-card to-emerald-50/20 shadow-md dark:border-emerald-900/60 ${className}`}>
      {/* Header Bar with Key Metadata and Main Lucide Controls */}
      <CardHeader className="border-b border-border/80 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 px-4 py-4 text-white sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-400/40 bg-emerald-800/60 text-emerald-100 text-xs font-semibold">
                <MapPin className="me-1 h-3.5 w-3.5 text-emerald-300" />
                {copyFor(language, 'Field Boundaries (WGS84)', 'حدود الحقول المكانية (WGS84)', 'Limites Parcellaires')}
              </Badge>
              <Badge className="border-teal-400/40 bg-teal-800/60 text-teal-100 text-xs">
                <Layers className="me-1 h-3.5 w-3.5 text-teal-300" />
                {copyFor(language, 'Multi-Layer Spatial Twin', 'التوأم المكاني متعدد الطبقات', 'Jumeau Spatial Multicouche')}
              </Badge>
              <Badge className="border-amber-400/40 bg-amber-800/60 text-amber-100 text-xs">
                <Mountain className="me-1 h-3.5 w-3.5 text-amber-300" />
                {copyFor(language, 'Topography & Relief', 'التضاريس والمناسيب', 'Topographie & Relief')}
              </Badge>
            </div>
            <CardTitle className="text-lg font-black tracking-tight sm:text-xl text-white">
              {copyFor(language, 'Interactive Field Boundary Map', 'الخريطة التفاعلية لحدود الحقول والقطع', 'Carte Interactive des Limites Parcellaires')}
            </CardTitle>
            <CardDescription className="text-xs text-emerald-100/90">
              {copyFor(
                language,
                'Visualize vector parcel geometries, elevation contours, NDVI health gradients, and centroid telemetry.',
                'استعراض حدود القطع المتجهة، وخطوط المناسيب الكنتورية، وتدرجات صحة الغطاء النباتي، وبيانات المراكز الجغرافية.',
                'Visualisez les géométries vectorielles, les courbes de niveau, les gradients NDVI et la télémétrie centroïde.'
              )}
            </CardDescription>
          </div>

          {/* Regional Preset Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
              <span className="px-2 text-[11px] font-medium text-emerald-100">
                {copyFor(language, 'Algeria Farm Preset:', 'نموذج المزرعة:', 'Modèle agricole :')}
              </span>
              <select
                value={selectedPresetId}
                onChange={(e) => {
                  setSelectedPresetId(e.target.value);
                  resetView();
                }}
                className="h-8 rounded-lg border border-white/20 bg-emerald-950/80 px-2.5 text-xs font-semibold text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {ALGERIA_FARM_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-slate-900 text-white">
                    {language === 'ar' ? preset.nameAr : language === 'fr' ? preset.nameFr : preset.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportGeoJson}
              className="gap-1.5 border-white/30 bg-white/10 text-xs font-semibold text-white hover:bg-white/20 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              {copyFor(language, 'GeoJSON', 'تصدير GeoJSON', 'Exporter GeoJSON')}
            </Button>
          </div>
        </div>

        {/* Layer Mode Selector (Prominent Lucide Layers & Mountain Controls) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-xs font-bold text-emerald-200 flex items-center gap-1">
              <Layers className="h-4 w-4 text-emerald-400" />
              {copyFor(language, 'Visual Layers:', 'الطبقات البصرية:', 'Couches Visuelles :')}
            </span>

            <Button
              type="button"
              size="sm"
              variant={layerMode === 'parcels' ? 'secondary' : 'ghost'}
              onClick={() => setLayerMode('parcels')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${
                layerMode === 'parcels'
                  ? 'bg-emerald-500 text-white font-bold shadow'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {copyFor(language, 'Parcels & Crops', 'القطع والمحاصيل', 'Parcelles & Cultures')}
            </Button>

            <Button
              type="button"
              size="sm"
              variant={layerMode === 'ndvi' ? 'secondary' : 'ghost'}
              onClick={() => setLayerMode('ndvi')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${
                layerMode === 'ndvi'
                  ? 'bg-emerald-500 text-white font-bold shadow'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-green-300" />
              {copyFor(language, 'NDVI Biomass', 'كتلة الغطاء النباتي NDVI', 'Biomasse NDVI')}
            </Button>

            <Button
              type="button"
              size="sm"
              variant={layerMode === 'irrigation' ? 'secondary' : 'ghost'}
              onClick={() => setLayerMode('irrigation')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${
                layerMode === 'irrigation'
                  ? 'bg-sky-500 text-white font-bold shadow'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Droplets className="h-3.5 w-3.5 text-sky-300" />
              {copyFor(language, 'Water & Irrigation', 'الرطوبة واحتياج الري', 'Eau & Irrigation')}
            </Button>

            <Button
              type="button"
              size="sm"
              variant={layerMode === 'soil' ? 'secondary' : 'ghost'}
              onClick={() => setLayerMode('soil')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${
                layerMode === 'soil'
                  ? 'bg-amber-600 text-white font-bold shadow'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Sprout className="h-3.5 w-3.5 text-amber-300" />
              {copyFor(language, 'Soil Zones', 'مناطق نسجة التربة', 'Zones Pédo')}
            </Button>
          </div>

          {/* Toggleable Overlays (Contours Mountain & Centroids MapPin) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowContours((c) => !c)}
              className={`h-7 px-2 text-xs gap-1 border-white/20 ${
                showContours ? 'bg-amber-500/30 text-amber-200 border-amber-400/50' : 'bg-white/5 text-emerald-200'
              }`}
            >
              <Mountain className="h-3.5 w-3.5 text-amber-300" />
              {copyFor(language, 'Elevation Contours', 'خطوط الارتفاع', 'Courbes de niveau')}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowCentroidPins((p) => !p)}
              className={`h-7 px-2 text-xs gap-1 border-white/20 ${
                showCentroidPins ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50' : 'bg-white/5 text-emerald-200'
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-300" />
              {copyFor(language, 'Centroid Pins', 'دبابيس المراكز', 'Épingles')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Main Interactive Map Viewport (9 Cols on Large) */}
          <div
            ref={viewportRef}
            className="relative min-h-[460px] lg:col-span-8 xl:col-span-9 bg-slate-950 overflow-hidden select-none"
          >
            {/* Top Toolbar Overlay (Zoom, Compass, Pan HUD) */}
            <div className="absolute top-3 start-3 z-10 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 p-1 backdrop-blur-md shadow-lg">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={zoomIn}
                className="h-7 w-7 text-white hover:bg-white/20"
                title={copyFor(language, 'Zoom In', 'تكبير', 'Zoomer')}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={zoomOut}
                className="h-7 w-7 text-white hover:bg-white/20"
                title={copyFor(language, 'Zoom Out', 'تصغير', 'Dézoomer')}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-white/20" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetView}
                className="h-7 px-2 text-[11px] font-medium text-white hover:bg-white/20 gap-1"
                title={copyFor(language, 'Fit to Farm Bounds', 'ملاءمة الحدود', 'Ajuster l’emprise')}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {copyFor(language, 'Fit', 'ملاءمة', 'Ajuster')}
              </Button>
              <div className="h-4 w-px bg-white/20" />
              <span className="px-1 text-[10px] font-mono text-emerald-300">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Compass & Elevation Indicator (Top Right) */}
            <div className="absolute top-3 end-3 z-10 flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-2.5 py-1 backdrop-blur-md shadow-lg text-white">
                <Compass className="h-4 w-4 text-rose-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-white">N · 0°</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-950/80 px-2.5 py-1 backdrop-blur-md shadow-lg text-amber-200 text-xs">
                <Mountain className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-mono font-semibold">{activePreset.baseElevationM}m a.s.l.</span>
              </div>
            </div>

            {/* Live Cursor Coordinate HUD (Bottom Left) */}
            <div className="absolute bottom-3 start-3 z-10 rounded-xl border border-white/15 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md shadow-lg text-white text-[11px] font-mono flex items-center gap-3">
              <div className="flex items-center gap-1 text-emerald-400">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {cursorGeo
                    ? `${cursorGeo.lat.toFixed(5)}°N, ${cursorGeo.lng.toFixed(5)}°E`
                    : `${activePreset.centerLat.toFixed(5)}°N, ${activePreset.centerLng.toFixed(5)}°E`}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-amber-300 border-s border-white/20 ps-3">
                <Mountain className="h-3 w-3" />
                <span>{cursorGeo ? `${cursorGeo.elev}m` : `${activePreset.baseElevationM}m`}</span>
              </div>
              <div className="hidden md:block text-slate-400 border-s border-white/20 ps-3 text-[10px]">
                EPSG:4326 (WGS84)
              </div>
            </div>

            {/* Scale Bar (Bottom Right) */}
            <div className="absolute bottom-3 end-3 z-10 rounded-lg border border-white/15 bg-slate-900/80 px-2.5 py-1 text-white text-[10px] font-mono backdrop-blur-md flex flex-col items-center">
              <div className="w-16 h-1 bg-white border border-slate-700 mb-0.5 rounded-sm flex">
                <div className="w-1/2 h-full bg-emerald-500" />
                <div className="w-1/2 h-full bg-white" />
              </div>
              <span>200 m</span>
            </div>

            {/* SVG Interactive Canvas */}
            <div
              ref={containerRef}
              className={`w-full h-full min-h-[460px] flex items-center justify-center cursor-${
                isDragging ? 'grabbing' : 'grab'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-full max-h-[560px] transition-transform duration-75"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* Background Terrain Simulation & Defs */}
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="farm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8" />
                  </pattern>

                  {/* Parcel Striped Patterns for Crops */}
                  <pattern id="orchard-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="8" cy="8" r="1.5" fill="rgba(255, 255, 255, 0.4)" />
                  </pattern>

                  <pattern id="cereal-stripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.2" />
                  </pattern>

                  <pattern id="pivot-radial" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" />
                  </pattern>

                  {/* Parcel Glow Filter */}
                  <filter id="parcel-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.8" />
                  </filter>

                  <filter id="selection-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.9" />
                  </filter>
                </defs>

                {/* Dark Base Canvas */}
                <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#090d16" />

                {/* Soil/Terrain Tinted Gradient */}
                <radialGradient id="terrain-gradient" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#0f1f1d" />
                  <stop offset="60%" stopColor="#0c1719" />
                  <stop offset="100%" stopColor="#080c10" />
                </radialGradient>
                <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#terrain-gradient)" />

                {/* Coordinate Grid Overlay */}
                {showGrid && <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#farm-grid)" />}

                {/* Topographic Elevation Contours (Mountain Mode) */}
                {showContours && (
                  <g className="elevation-contours" opacity={layerMode === 'parcels' ? 0.35 : 0.6}>
                    {elevationContours.map((contour, i) => (
                      <g key={`contour-${i}`}>
                        <path
                          d={contour.path}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={i % 2 === 0 ? '1.2' : '0.7'}
                          strokeDasharray={i % 2 === 0 ? 'none' : '4,3'}
                          opacity={0.65}
                        />
                        {/* Elevation Label Text */}
                        <text
                          x={SVG_WIDTH * 0.88}
                          y={SVG_HEIGHT * (0.16 + (i / 6) * 0.7)}
                          fill="#f59e0b"
                          fontSize="9"
                          fontFamily="monospace"
                          opacity={0.8}
                        >
                          {contour.label}
                        </text>
                      </g>
                    ))}
                  </g>
                )}

                {/* Farm Road Network & Boundary Buffers */}
                <g className="farm-infrastructure" opacity="0.3">
                  <line
                    x1={SVG_WIDTH * 0.48}
                    y1={0}
                    x2={SVG_WIDTH * 0.52}
                    y2={SVG_HEIGHT}
                    stroke="#94a3b8"
                    strokeWidth="4"
                    strokeDasharray="6,4"
                  />
                  <line
                    x1={0}
                    y1={SVG_HEIGHT * 0.5}
                    x2={SVG_WIDTH}
                    y2={SVG_HEIGHT * 0.48}
                    stroke="#94a3b8"
                    strokeWidth="3"
                    strokeDasharray="5,4"
                  />
                </g>

                {/* Field Parcels (Geometric Boundary Polygons) */}
                <g className="field-parcels">
                  {svgPolygons.map((poly) => {
                    const isSelected = selectedFieldId === poly.field.id;
                    const isHovered = hoveredFieldId === poly.field.id;
                    const { color, fillOpacity } = getFieldFillColor(poly.field, isSelected, isHovered);

                    const cropKey = poly.field.crop.toLowerCase();
                    const isCereal = cropKey.includes('wheat') || cropKey.includes('barley') || cropKey.includes('cereal');
                    const isOrchard = cropKey.includes('citrus') || cropKey.includes('olive') || cropKey.includes('palm');

                    return (
                      <g
                        key={poly.field.id}
                        className="cursor-pointer transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectField) onSelectField(poly.field.id);
                        }}
                        onMouseEnter={(e) => {
                          setHoveredFieldId(poly.field.id);
                          if (viewportRef.current) {
                            const rect = viewportRef.current.getBoundingClientRect();
                            setBoundaryHoverTooltip({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                              field: poly.field,
                              displayAreaHa: poly.displayAreaHa,
                              displayPerimeterM: poly.displayPerimeterM,
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          if (viewportRef.current) {
                            const rect = viewportRef.current.getBoundingClientRect();
                            setBoundaryHoverTooltip({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                              field: poly.field,
                              displayAreaHa: poly.displayAreaHa,
                              displayPerimeterM: poly.displayPerimeterM,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredFieldId(null);
                          setBoundaryHoverTooltip(null);
                        }}
                      >
                        {/* Base Fill & Field Boundary Path */}
                        <path
                          className="field-boundary-path cursor-pointer transition-all duration-150 hover:brightness-110"
                          d={poly.pathString}
                          fill={color}
                          fillOpacity={fillOpacity}
                          stroke={isSelected ? '#38bdf8' : isHovered ? '#10b981' : color}
                          strokeWidth={isSelected ? '3.5' : isHovered ? '2.5' : '1.8'}
                          strokeLinejoin="round"
                          filter={isSelected ? 'url(#selection-glow)' : isHovered ? 'url(#parcel-glow)' : undefined}
                        />

                        {/* Texture Overlay (Orchards / Cereals) */}
                        {isOrchard && (
                          <path
                            d={poly.pathString}
                            fill="url(#orchard-dots)"
                            opacity="0.3"
                            pointerEvents="none"
                          />
                        )}
                        {isCereal && (
                          <path
                            d={poly.pathString}
                            fill="url(#cereal-stripes)"
                            opacity="0.25"
                            pointerEvents="none"
                          />
                        )}

                        {/* Vertices Points (When Selected or Hovered) */}
                        {(isSelected || isHovered) && (
                          <g className="vertices">
                            {poly.svgPoints.map(([vx, vy], vi) => (
                              <circle
                                key={`vertex-${vi}`}
                                cx={vx}
                                cy={vy}
                                r={isSelected ? '4' : '3'}
                                fill="#ffffff"
                                stroke={isSelected ? '#0284c7' : '#059669'}
                                strokeWidth="1.5"
                              />
                            ))}
                          </g>
                        )}

                        {/* Field Centroid Marker & Label */}
                        {showCentroidPins && (
                          <g
                            transform={`translate(${poly.centroid.x}, ${poly.centroid.y})`}
                            className="pointer-events-none"
                          >
                            {/* Pin Circle */}
                            <circle
                              cx="0"
                              cy="0"
                              r={isSelected ? '7' : '5'}
                              fill={isSelected ? '#38bdf8' : '#10b981'}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                            <circle cx="0" cy="0" r="2" fill="#ffffff" />

                            {/* Label Card */}
                            {showFieldLabels && (
                              <g transform="translate(0, 16)">
                                <rect
                                  x="-48"
                                  y="-8"
                                  width="96"
                                  height="24"
                                  rx="6"
                                  fill="rgba(15, 23, 42, 0.85)"
                                  stroke={isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)'}
                                  strokeWidth={isSelected ? '1.5' : '0.8'}
                                />
                                <text
                                  x="0"
                                  y="2"
                                  fill="#ffffff"
                                  fontSize="9"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fontFamily="sans-serif"
                                >
                                  {poly.field.name.length > 14
                                    ? poly.field.name.slice(0, 13) + '…'
                                    : poly.field.name}
                                </text>
                                <text
                                  x="0"
                                  y="11"
                                  fill="#94a3b8"
                                  fontSize="7.5"
                                  textAnchor="middle"
                                  fontFamily="monospace"
                                >
                                  {poly.displayAreaHa} ha · {poly.field.crop}
                                </text>
                              </g>
                            )}
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Interactive Field Boundary Hover Tooltip / Popover */}
            {boundaryHoverTooltip && (
              <div
                className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full transition-all duration-75 ease-out"
                style={{
                  left: `${boundaryHoverTooltip.x}px`,
                  top: `${Math.max(14, boundaryHoverTooltip.y - 12)}px`,
                }}
              >
                <div className="flex flex-col gap-2 rounded-xl border border-emerald-400/50 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-md min-w-[220px] max-w-[290px]">
                  {/* Top Bar: Field Name & Area Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-black tracking-tight text-white truncate">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: boundaryHoverTooltip.field.color }}
                        />
                        <span className="truncate">{boundaryHoverTooltip.field.name}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] font-mono text-emerald-300">
                        {copyFor(language, 'Field Parcel', 'قطعة حقل', 'Parcelle')} #{boundaryHoverTooltip.field.id.slice(-4)}
                      </div>
                    </div>
                    <Badge className="border-emerald-400/30 bg-emerald-950/90 text-emerald-300 font-mono text-[10px] shrink-0 font-bold px-2 py-0.5">
                      {boundaryHoverTooltip.displayAreaHa} ha
                    </Badge>
                  </div>

                  {/* Core Metrics: Field Name, Total Area, and Current Crop */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="rounded-lg bg-white/5 p-2">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        {copyFor(language, 'Current Crop', 'المحصول الحالي', 'Culture')}
                      </div>
                      <div className="font-bold capitalize text-white truncate mt-1 flex items-center gap-1">
                        <Sprout className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{boundaryHoverTooltip.field.crop}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/5 p-2">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        {copyFor(language, 'Total Area', 'المساحة الإجمالية', 'Superficie')}
                      </div>
                      <div className="font-bold text-white font-mono mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        <span>{boundaryHoverTooltip.displayAreaHa} ha</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Agronomic Telemetry Badges */}
                  <div className="flex items-center justify-between text-[10px] text-slate-300 border-t border-white/10 pt-1.5 font-mono">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Mountain className="h-3 w-3" />
                      {boundaryHoverTooltip.field.avgElevationM}m
                    </span>
                    <span className="flex items-center gap-1 text-emerald-300">
                      <Activity className="h-3 w-3" />
                      {boundaryHoverTooltip.field.healthScore}% health
                    </span>
                    <span className="flex items-center gap-1 text-sky-300">
                      <Droplets className="h-3 w-3" />
                      {boundaryHoverTooltip.field.waterDemandLevel}
                    </span>
                  </div>

                  {/* Downward Popover Caret Arrow */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b border-emerald-400/50 bg-slate-900/95" />
                </div>
              </div>
            )}
          </div>

          {/* Right Inspector & Boundary Telemetry Panel (3-4 Cols) */}
          <div className="border-t border-border/80 lg:border-t-0 lg:border-s lg:col-span-4 xl:col-span-3 bg-card p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {copyFor(language, 'Field Telemetry', 'قياسات الحقل المحدد', 'Télémétrie Parcelle')}
                    </h4>
                    <p className="text-sm font-black text-foreground truncate max-w-[170px]">
                      {highlightedField?.name ?? copyFor(language, 'Select a field', 'اختر حقلاً', 'Sélectionnez une parcelle')}
                    </p>
                  </div>
                </div>

                {highlightedField && (
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                  >
                    {highlightedField.areaHa} ha
                  </Badge>
                )}
              </div>

              {highlightedField ? (
                <div className="space-y-3">
                  {/* Quick Metric Cards */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                      <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Sprout className="h-3 w-3 text-emerald-600" />
                        {copyFor(language, 'Crop & Stage', 'المحصول', 'Culture')}
                      </div>
                      <div className="mt-1 text-xs font-bold capitalize">{highlightedField.crop}</div>
                      <div className="text-[10px] text-muted-foreground">Kc {highlightedField.kc}</div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                      <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Mountain className="h-3 w-3 text-amber-600" />
                        {copyFor(language, 'Elevation & Slope', 'المنسوب والانحدار', 'Altitude & Pente')}
                      </div>
                      <div className="mt-1 text-xs font-bold font-mono">{highlightedField.avgElevationM}m a.s.l.</div>
                      <div className="text-[10px] text-muted-foreground">{highlightedField.slopePct}% grade</div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                      <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3 text-green-600" />
                        {copyFor(language, 'NDVI Health', 'صحة NDVI', 'Santé NDVI')}
                      </div>
                      <div className="mt-1 text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300">
                        {highlightedField.ndviAverage.toFixed(2)} / 1.0
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {highlightedField.healthScore}/100 score
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5">
                      <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-sky-600" />
                        {copyFor(language, 'Water Demand', 'طلب الري', 'Demande en eau')}
                      </div>
                      <div className="mt-1 text-xs font-bold capitalize text-sky-700 dark:text-sky-300">
                        {highlightedField.waterDemandLevel}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{highlightedField.soilTexture}</div>
                    </div>
                  </div>

                  {/* Polygon Boundary Metrics */}
                  <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        {copyFor(language, 'Boundary Coordinates (WGS84)', 'إحداثيات الحدود (WGS84)', 'Coordonnées Limites')}
                      </span>
                      <span className="font-mono text-[10px]">{highlightedField.coordinates.length} vertices</span>
                    </div>

                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[10px] text-muted-foreground">
                      {highlightedField.coordinates.slice(0, 4).map(([lng, lat], vi) => (
                        <div key={`coord-${vi}`} className="flex items-center justify-between bg-background/60 px-2 py-0.5 rounded border border-border/50">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">V{vi + 1}</span>
                          <span>Lat: {lat.toFixed(5)}°</span>
                          <span>Lng: {lng.toFixed(5)}°</span>
                        </div>
                      ))}
                      {highlightedField.coordinates.length > 4 && (
                        <div className="text-center text-[9px] text-muted-foreground">
                          +{highlightedField.coordinates.length - 4} {copyFor(language, 'more boundary points', 'نقاط حدود إضافية', 'autres points')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  {copyFor(language, 'Click any field parcel on the map to inspect.', 'انقر على أي حقل في الخريطة لمعاينته.', 'Cliquez sur une parcelle pour inspecter.')}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
                  onClick={() => onOpenFarmTool?.('collapse_boundary')}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {copyFor(language, 'Import / Draw Boundaries', 'استيراد ورسم الحدود', 'Importer / Tracer')}
                </Button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <span>{mapFields.length} {copyFor(language, 'Active Parcels', 'حقول نشطة', 'Parcelles Actives')}</span>
                <span>{copyFor(language, 'Algeria Agro-Cadastre', 'السجل الفلاحي الجزائري', 'Cadastre Agricole')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
