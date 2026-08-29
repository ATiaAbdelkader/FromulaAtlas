'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Layers,
  Search,
  Filter,
  Info,
  ChevronRight,
  TrendingUp,
  Droplets,
  Sprout,
  Sun,
  CloudRain,
  AlertTriangle,
  Compass,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Wind,
  Thermometer,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Mountain,
  Eye,
  CircleDot,
  Building,
  FlaskConical,
  Bug,
  Satellite,
  Maximize2,
} from 'lucide-react';
import { useLanguageStore, type Language } from '@/lib/language-store';
import {
  ALGERIA_AGRO_ZONES_CONFIG,
  SOIL_CLASSES_INFO,
  ALGERIA_CROP_SUITABILITY_RULES,
  type AlgeriaAgroZone,
  type AlgeriaSoilClass,
  type AlgeriaBioclimate,
  type MajorCropCategory,
} from '@/lib/algeria-map-data';
import { ALL_58_WILAYAS, type WilayaDataFull } from '@/lib/algeria-wilayas-58';
import {
  ALGERIA_MAJOR_DAMS,
  ALGERIA_PIVOT_CLUSTERS,
  ALGERIA_CCLS_SILOS,
  ALGERIA_SUPPLY_HUBS,
  ALGERIA_LOCUST_ZONES,
  ALGERIA_SATELLITE_GRID,
  type DamData,
  type PivotClusterData,
  type CclsSiloData,
  type AgroSupplyHub,
  type LocustRiskZone,
  type SatelliteAgriGridPoint,
} from '@/lib/algeria-gis-layers-data';
import {
  getAlgeriaNationalPath,
  getWilayaPolygonFeatures,
  TOPOGRAPHIC_RELIEF_DATA,
  type WilayaPolygonFeature,
} from '@/lib/algeria-gis-geometry';
import { fetchForecastAndHistory, type ForecastCurrent, type DailyForecast } from '@/lib/open-meteo';
import AlgeriaAdvancedGISTools from '@/components/agri/soil/AlgeriaAdvancedGISTools';
import AlgeriaRegionalStatsPopup from '@/components/agri/soil/AlgeriaRegionalStatsPopup';
import AlgeriaMapDynamicLegend from '@/components/agri/soil/AlgeriaMapDynamicLegend';
import { type DrawnPlot, type PlotVertex, type PlotShapeType } from '@/components/agri/soil/AlgeriaPlotDrawerModal';

type MapViewLayer =
  | 'agro_zones'
  | 'soil_classes'
  | 'bioclimate'
  | 'rainfall'
  | 'crop_specialty'
  | 'salinity_risk'
  | 'soil_ph'
  | 'crop_suitability'
  | 'dams'
  | 'pivots'
  | 'ccls'
  | 'locust'
  | 'satellite_ndvi';

type BaseMapTheme = 'vector' | 'topographic' | 'satellite_tone';

export default function AlgeriaAgriMap() {
  const { language } = useLanguageStore();
  const lang: Language = language || 'fr';

  // State
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(7); // Default to Biskra (07)
  const [activeLayer, setActiveLayer] = useState<MapViewLayer>('agro_zones');
  const [selectedCropId, setSelectedCropId] = useState<string>('wheat_durum');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterSoil, setFilterSoil] = useState<string>('all');
  const [baseMapTheme, setBaseMapTheme] = useState<BaseMapTheme>('vector');

  // Overlay Toggles (multi-select)
  const [showDamsOverlay, setShowDamsOverlay] = useState<boolean>(true);
  const [showPivotsOverlay, setShowPivotsOverlay] = useState<boolean>(true);
  const [showCclsOverlay, setShowCclsOverlay] = useState<boolean>(false);
  const [showLocustOverlay, setShowLocustOverlay] = useState<boolean>(false);
  const [showSatelliteGridOverlay, setShowSatelliteGridOverlay] = useState<boolean>(false);

  // Hover & Tooltips
  const [hoveredWilaya, setHoveredWilaya] = useState<WilayaDataFull | null>(null);
  const [hoveredLegendSoil, setHoveredLegendSoil] = useState<AlgeriaSoilClass | null>(null);
  const [hoveredDam, setHoveredDam] = useState<DamData | null>(null);
  const [hoveredPivot, setHoveredPivot] = useState<PivotClusterData | null>(null);
  const [hoveredSilo, setHoveredSilo] = useState<CclsSiloData | null>(null);
  const [hoveredLocust, setHoveredLocust] = useState<LocustRiskZone | null>(null);
  const [hoveredSatPoint, setHoveredSatPoint] = useState<SatelliteAgriGridPoint | null>(null);

  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('algeria_agri_map_legend_expanded');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {
        // ignore
      }
    }
    return true;
  });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Regional & Wilaya Statistics Popup Modal
  const [isRegionalPopupOpen, setIsRegionalPopupOpen] = useState<boolean>(false);
  const [popupSelectedWilaya, setPopupSelectedWilaya] = useState<WilayaDataFull | null>(null);
  const [popupSelectedZone, setPopupSelectedZone] = useState<AlgeriaAgroZone | null>(null);
  const [hoveredMacroZone, setHoveredMacroZone] = useState<AlgeriaAgroZone | null>(null);

  // Custom User CAD Plots
  const [drawnPlots, setDrawnPlots] = useState<DrawnPlot[]>([
    {
      id: 'default_plot_1',
      name: 'Adrar Tsabit Pivot Cluster 01',
      shapeType: 'center_pivot',
      cropType: 'Blé Dur de Semence',
      vertices: [],
      pivotCenter: { id: 'p1', lat: 27.92, lng: -0.28, xPct: 31, yPct: 64 },
      pivotRadiusMeters: 400,
      calculatedAreaHa: 50.2,
      calculatedPerimeterM: 2513,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [activePlot, setActivePlot] = useState<DrawnPlot | null>(drawnPlots[0]);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [currentDrawVertices, setCurrentDrawVertices] = useState<PlotVertex[]>([]);

  // GIS Granular Vector & Layer Display Toggles
  const [showWilayaPolygons, setShowWilayaPolygons] = useState<boolean>(true);
  const [showTopography, setShowTopography] = useState<boolean>(true);
  const [showWilayaLabels, setShowWilayaLabels] = useState<boolean>(true);
  const [showMacroBands, setShowMacroBands] = useState<boolean>(false);
  const [hoveredPolygonCode, setHoveredPolygonCode] = useState<number | null>(null);

  // Pre-computed vector geometry
  const nationalPath = useMemo(() => getAlgeriaNationalPath(), []);
  const wilayaPolygons = useMemo(() => getWilayaPolygonFeatures(), []);

  // Quick Region Focus Presets
  const handleFocusRegion = (region: 'all' | 'tell' | 'plateaus' | 'oasis' | 'sahara') => {
    if (region === 'all') {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else if (region === 'tell') {
      // Focus on Tell & Littoral
      setZoomLevel(2.2);
      setPanOffset({ x: -20, y: 220 });
    } else if (region === 'plateaus') {
      // Focus on High Plateaus
      setZoomLevel(2.0);
      setPanOffset({ x: -30, y: 150 });
    } else if (region === 'oasis') {
      // Focus on Saharan Oasis & Ziban/Souf
      setZoomLevel(2.0);
      setPanOffset({ x: -100, y: 30 });
    } else if (region === 'sahara') {
      // Focus on Deep Sahara
      setZoomLevel(1.5);
      setPanOffset({ x: 0, y: -110 });
    }
  };

  // Live weather state for selected wilaya
  const [weatherData, setWeatherData] = useState<{
    current: ForecastCurrent | null;
    daily: DailyForecast[];
    loading: boolean;
    error: string | null;
  }>({
    current: null,
    daily: [],
    loading: false,
    error: null,
  });

  // Selected wilaya object
  const selectedWilaya = useMemo(() => {
    return (
      ALL_58_WILAYAS.find((w) => w.code === selectedWilayaCode) ||
      ALL_58_WILAYAS[0]
    );
  }, [selectedWilayaCode]);

  // Selected crop rule
  const selectedCropRule = useMemo(() => {
    return (
      ALGERIA_CROP_SUITABILITY_RULES.find((c) => c.cropId === selectedCropId) ||
      ALGERIA_CROP_SUITABILITY_RULES[0]
    );
  }, [selectedCropId]);

  // Fetch live weather when selected wilaya changes
  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      if (!selectedWilaya) return;
      setWeatherData((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await fetchForecastAndHistory({
          lat: selectedWilaya.lat,
          lng: selectedWilaya.lng,
          daysPast: 0,
          daysForecast: 5,
        });
        if (isMounted) {
          setWeatherData({
            current: res.current || null,
            daily: res.daily || [],
            loading: false,
            error: null,
          });
        }
      } catch (err: unknown) {
        if (isMounted) {
          setWeatherData({
            current: null,
            daily: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Weather service offline',
          });
        }
      }
    }
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [selectedWilaya]);

  // Filtered list of wilayas
  const filteredWilayas = useMemo(() => {
    return ALL_58_WILAYAS.filter((w) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName =
          w.nameFr.toLowerCase().includes(q) ||
          w.nameAr.includes(q) ||
          w.nameEn.toLowerCase().includes(q) ||
          w.codeStr.includes(q) ||
          w.keyProduceFr.toLowerCase().includes(q) ||
          w.keyProduceAr.includes(q);
        if (!matchName) return false;
      }
      // Zone filter
      if (filterZone !== 'all' && w.zone !== filterZone) return false;
      // Soil filter
      if (filterSoil !== 'all' && w.dominantSoil !== filterSoil) return false;
      return true;
    });
  }, [searchQuery, filterZone, filterSoil]);

  // Calculate color for a wilaya based on active layer
  const getWilayaColor = (w: WilayaDataFull) => {
    switch (activeLayer) {
      case 'agro_zones':
        return ALGERIA_AGRO_ZONES_CONFIG[w.zone]?.color || '#059669';

      case 'soil_classes':
        return SOIL_CLASSES_INFO[w.dominantSoil]?.color || '#475569';

      case 'bioclimate':
        if (w.bioclimate === 'humid') return '#0284c7';
        if (w.bioclimate === 'semi_arid') return '#10b981';
        if (w.bioclimate === 'arid') return '#f59e0b';
        return '#ef4444';

      case 'rainfall':
        if (w.rainfallMm >= 700) return '#0369a1';
        if (w.rainfallMm >= 400) return '#0284c7';
        if (w.rainfallMm >= 250) return '#10b981';
        if (w.rainfallMm >= 100) return '#f59e0b';
        return '#dc2626';

      case 'crop_specialty':
        if (w.dominantCrops.includes('cereals')) return '#eab308';
        if (w.dominantCrops.includes('greenhouses')) return '#ef4444';
        if (w.dominantCrops.includes('pivot_potato')) return '#854d0e';
        if (w.dominantCrops.includes('date_palms')) return '#d97706';
        if (w.dominantCrops.includes('citrus')) return '#f97316';
        if (w.dominantCrops.includes('olives')) return '#65a30d';
        return '#0284c7';

      case 'salinity_risk':
        if (w.salinityRisk === 'severe') return '#991b1b';
        if (w.salinityRisk === 'high') return '#ef4444';
        if (w.salinityRisk === 'moderate') return '#f59e0b';
        if (w.salinityRisk === 'low') return '#10b981';
        return '#06b6d4';

      case 'soil_ph':
        if (w.ph >= 8.2) return '#dc2626';
        if (w.ph >= 7.8) return '#f59e0b';
        if (w.ph >= 7.2) return '#10b981';
        return '#0284c7';

      case 'crop_suitability': {
        const rule = selectedCropRule;
        if (rule.favorableZones.includes(w.zone)) return '#059669'; // optimal (green)
        if (rule.unsuitableZones.includes(w.zone)) return '#dc2626'; // unfavorable (red)
        return '#eab308'; // moderate / conditional (amber)
      }

      case 'dams':
        return '#0284c7';

      case 'pivots':
        return '#d97706';

      case 'ccls':
        return '#16a34a';

      case 'locust':
        return '#e11d48';

      case 'satellite_ndvi':
        return '#10b981';

      default:
        return '#059669';
    }
  };

  /**
   * High-accuracy Geographic Coordinate Projection:
   * Maps Latitude (19°N to 37.5°N) and Longitude (-8.8°W to 12.0°E) to SVG ViewBox (800x800).
   */
  const projectCoordinates = (lat: number, lng: number) => {
    const minLng = -9.0;
    const maxLng = 12.5;
    const minLat = 18.5;
    const maxLat = 37.8;

    const x = ((lng - minLng) / (maxLng - minLng)) * 640 + 80;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 680 + 60;

    return { x, y };
  };

  // Zoom and Pan Handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDrawingMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isDrawingMode) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Map Click Handler for Drawing Mode
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert SVG view coordinates back to approx Lat/Lng
    const minLng = -9.0;
    const maxLng = 12.5;
    const minLat = 18.5;
    const maxLat = 37.8;

    const svgX = (clickX / rect.width) * 800;
    const svgY = (clickY / rect.height) * 800;

    const lng = minLng + ((svgX - 80) / 640) * (maxLng - minLng);
    const lat = maxLat - ((svgY - 60) / 680) * (maxLat - minLat);

    const newVertex: PlotVertex = {
      id: `v_${Date.now()}`,
      lat,
      lng,
      xPct: (clickX / rect.width) * 100,
      yPct: (clickY / rect.height) * 100,
    };

    const updated = [...currentDrawVertices, newVertex];
    setCurrentDrawVertices(updated);

    if (updated.length >= 3) {
      // Calculate polygon area approx
      const approxAreaHa = Math.round(updated.length * 15.2 * 10) / 10;
      const newPlot: DrawnPlot = {
        id: `plot_${Date.now()}`,
        name: `Parcelle Dessinée ${drawnPlots.length + 1}`,
        shapeType: 'polygon',
        cropType: 'Culture Maraîchère & Céréales',
        vertices: updated,
        calculatedAreaHa: approxAreaHa,
        calculatedPerimeterM: updated.length * 750,
        createdAt: new Date().toISOString(),
      };
      setActivePlot(newPlot);
    }
  };

  const handleSavePlot = (plot: DrawnPlot) => {
    setDrawnPlots((prev) => [plot, ...prev.filter((p) => p.id !== plot.id)]);
    setActivePlot(plot);
  };

  const handleDeletePlot = (id: string) => {
    setDrawnPlots((prev) => prev.filter((p) => p.id !== id));
    if (activePlot?.id === id) {
      setActivePlot(null);
    }
  };

  // Regional Zone & Wilaya Click Handlers for Popup
  const handleWilayaClick = (w: WilayaDataFull) => {
    setSelectedWilayaCode(w.code);
    setPopupSelectedWilaya(w);
    setPopupSelectedZone(w.zone);
    setIsRegionalPopupOpen(true);
  };

  const handleMacroZoneClick = (zone: AlgeriaAgroZone) => {
    setPopupSelectedZone(zone);
    const wilayasInZone = ALL_58_WILAYAS.filter((w) => w.zone === zone);
    const targetWilaya = wilayasInZone.find((w) => w.code === selectedWilayaCode) || wilayasInZone[0];
    if (targetWilaya) {
      setSelectedWilayaCode(targetWilaya.code);
      setPopupSelectedWilaya(targetWilaya);
    }
    setIsRegionalPopupOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                🇩🇿
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {lang === 'ar' ? 'نظام المعلومات الجغرافية الفلاحي الوطني (SIG-AGRI)' : 'Système d’Information Géographique Agricole (SIG-AGRI)'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {lang === 'ar'
                ? 'خريطة الجزائر التفاعلية للتربة، السدود، الرشاشات المحورية والصوامع'
                : 'Atlas & Carte Interactive des Sols, Barrages, Pivots et Silos d’Algérie'}
            </h1>
            <p className="max-w-2xl text-xs text-slate-300 sm:text-sm">
              {lang === 'ar'
                ? 'تغطية شاملة لـ 58 ولاية: السدود (ANBT)، الرشاشات المحورية بالجنوب، صوامع ديوان الحبوب (CCLS)، رادار الجراد، والاستشعار الفضائي (Sentinel-2).'
                : 'Exploration exhaustive des 58 Wilayas : Réseaux hydrauliques ANBT, méga-pivots sahariens, silos CCLS, radar acridien et grille biophysique satellite.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 px-3 py-2 text-center border border-emerald-400/30">
              <span className="block text-lg font-bold leading-none text-emerald-300">58</span>
              <span className="text-[10px] text-emerald-200/80 uppercase font-medium">
                {lang === 'ar' ? 'ولاية فلاحية' : 'Wilayas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Layer Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 p-2 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ar' ? 'طبقة العرض الأساسية:' : 'Couche Principale :'}</span>
        </div>

        {[
          {
            id: 'agro_zones',
            labelFr: 'Zones Agro-Écologiques',
            labelAr: 'الأقاليم الفلاحية الكبرى',
            icon: Mountain,
          },
          {
            id: 'soil_classes',
            labelFr: 'Pédologie & Sols',
            labelAr: 'أنواع التربة (بيدولوجيا)',
            icon: Sprout,
          },
          {
            id: 'dams',
            labelFr: '💧 Barrages ANBT',
            labelAr: '💧 السدود الكبرى',
            icon: Droplets,
          },
          {
            id: 'pivots',
            labelFr: '🌀 Pivots Sahariens',
            labelAr: '🌀 الرشاشات المحورية',
            icon: CircleDot,
          },
          {
            id: 'ccls',
            labelFr: '🌾 Silos CCLS & Engrais',
            labelAr: '🌾 صوامع الحبوب والأسمدة',
            icon: Building,
          },
          {
            id: 'locust',
            labelFr: '🦗 Radar Acridien',
            labelAr: '🦗 رادار الجراد',
            icon: Bug,
          },
          {
            id: 'satellite_ndvi',
            labelFr: '🛰️ Vigueur NDVI Satellite',
            labelAr: '🛰️ الغطاء النباتي الفضائي',
            icon: Satellite,
          },
          {
            id: 'bioclimate',
            labelFr: 'Bioclimat & Aridité',
            labelAr: 'المناخ الحيوي والجفاف',
            icon: Sun,
          },
          {
            id: 'rainfall',
            labelFr: 'Précipitations (mm)',
            labelAr: 'الأمطار السنوية',
            icon: CloudRain,
          },
          {
            id: 'crop_suitability',
            labelFr: 'Simulateur d’Adéquation',
            labelAr: 'محاكي الملاءمة',
            icon: CheckCircle2,
          },
        ].map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as MapViewLayer)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? layer.labelAr : layer.labelFr}</span>
            </button>
          );
        })}
      </div>

      {/* Multi-Layer Overlays & Theme HUD Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-xs dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Row 1: Overlays & Vector Polygon Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'طبقات الخريطة التفاعلية:' : 'Couches & Objets SIG :'}
            </span>

            {/* Wilaya Polygons Toggle */}
            <button
              onClick={() => setShowWilayaPolygons(!showWilayaPolygons)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showWilayaPolygons
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>🗺️ 58 Wilayas</span>
            </button>

            {/* Topography & Relief Toggle */}
            <button
              onClick={() => setShowTopography(!showTopography)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showTopography
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>⛰️ Relief & Chotts</span>
            </button>

            {/* Wilaya Labels Toggle */}
            <button
              onClick={() => setShowWilayaLabels(!showWilayaLabels)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showWilayaLabels
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 ring-1 ring-indigo-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>🏷️ Noms & Codes</span>
            </button>

            {/* Dams Overlay */}
            <button
              onClick={() => setShowDamsOverlay(!showDamsOverlay)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showDamsOverlay
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 ring-1 ring-sky-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>💧 Barrages</span>
            </button>

            {/* Pivots Overlay */}
            <button
              onClick={() => setShowPivotsOverlay(!showPivotsOverlay)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showPivotsOverlay
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>🌀 Pivots Sahariens</span>
            </button>

            {/* CCLS Silos */}
            <button
              onClick={() => setShowCclsOverlay(!showCclsOverlay)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showCclsOverlay
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>🌾 Silos CCLS</span>
            </button>

            {/* Locust Radar */}
            <button
              onClick={() => setShowLocustOverlay(!showLocustOverlay)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showLocustOverlay
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ring-1 ring-rose-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>🦗 Radar Acridien</span>
            </button>

            {/* Satellite Grid */}
            <button
              onClick={() => setShowSatelliteGridOverlay(!showSatelliteGridOverlay)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                showSatelliteGridOverlay
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 ring-1 ring-purple-500'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <span>🛰️ Grille NDVI</span>
            </button>
          </div>

          {/* Base Map Style Toggles */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setBaseMapTheme('vector')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                baseMapTheme === 'vector'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Vector
            </button>
            <button
              onClick={() => setBaseMapTheme('topographic')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                baseMapTheme === 'topographic'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Topographie
            </button>
            <button
              onClick={() => setBaseMapTheme('satellite_tone')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                baseMapTheme === 'satellite_tone'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* Row 2: Geographic Region Quick Focus Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1">
            {lang === 'ar' ? 'تركيز جغرافي سريع:' : 'Cadrage Régional :'}
          </span>
          <button
            onClick={() => handleFocusRegion('all')}
            className="rounded-lg bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          >
            🇩🇿 {lang === 'ar' ? 'كامل القطر' : 'Tout le Pays'}
          </button>
          <button
            onClick={() => handleFocusRegion('tell')}
            className="rounded-lg bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          >
            🌊 {lang === 'ar' ? 'التِّل والساحل' : 'Tell & Littoral'}
          </button>
          <button
            onClick={() => handleFocusRegion('plateaus')}
            className="rounded-lg bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          >
            🌾 {lang === 'ar' ? 'الهضاب والسهوب' : 'Hauts Plateaux'}
          </button>
          <button
            onClick={() => handleFocusRegion('oasis')}
            className="rounded-lg bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-slate-800 dark:text-orange-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          >
            🌴 {lang === 'ar' ? 'الواحات والزيبان' : 'Oasis & Ziban'}
          </button>
          <button
            onClick={() => handleFocusRegion('sahara')}
            className="rounded-lg bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          >
            🏜️ {lang === 'ar' ? 'الصحراء الكبرى' : 'Grand Sud'}
          </button>
        </div>
      </div>

      {/* Main Map + Side Inspector Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Map Canvas (8 Cols) */}
        <div className="relative flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-8 overflow-hidden">
          {/* Map Top Floating Controls Bar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث عن ولاية أو محصول...' : 'Rechercher wilaya, culture...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Quick Zoom, Reset & Legend Toggle Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const nextState = !isLegendExpanded;
                  setIsLegendExpanded(nextState);
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.setItem('algeria_agri_map_legend_expanded', String(nextState));
                    } catch {
                      // ignore
                    }
                  }
                }}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition ${
                  isLegendExpanded
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
                title={
                  isLegendExpanded
                    ? lang === 'ar'
                      ? 'إخفاء دليل الخريطة'
                      : 'Masquer la légende'
                    : lang === 'ar'
                      ? 'إظهار دليل الخريطة'
                      : 'Afficher la légende'
                }
                aria-pressed={isLegendExpanded}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {lang === 'ar' ? 'الدليل' : 'Légende'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Map Viewport Area */}
          <div
            className={`relative h-[560px] w-full select-none overflow-hidden rounded-2xl border transition-colors ${
              baseMapTheme === 'satellite_tone'
                ? 'bg-gradient-to-b from-sky-950 via-slate-900 to-amber-950 border-emerald-900/40'
                : 'bg-gradient-to-b from-sky-50/50 via-slate-50 to-amber-50/40 border-slate-200 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* North Indicator */}
            <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-center rounded-xl bg-white/80 p-2 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur-sm dark:bg-slate-800/80 dark:text-slate-300">
              <span className="text-xs text-rose-600 font-extrabold">N</span>
              <Compass className="h-4 w-4 text-slate-500" />
              <span>▲</span>
            </div>

            {/* Hover Tooltip Overlay for Wilaya / Dam / Pivot */}
            {(hoveredWilaya || hoveredDam || hoveredPivot || hoveredSilo || hoveredLocust || hoveredSatPoint) && (
              <div
                className="pointer-events-none absolute z-20 rounded-xl bg-slate-900/95 p-3 text-xs text-white shadow-xl backdrop-blur-md transition-all border border-slate-700"
                style={{ left: '16px', bottom: '16px', maxWidth: '340px' }}
              >
                {hoveredDam && (
                  <div className="space-y-1">
                    <span className="font-bold text-sky-400 block text-sm">
                      💧 {hoveredDam.name[lang] || hoveredDam.name.fr}
                    </span>
                    <div className="text-[11px] text-slate-300">
                      Capacité : <strong>{hoveredDam.capacityMillionM3} Hm³</strong> | Remplissage: <strong>{hoveredDam.currentFillRatePct}%</strong>
                    </div>
                    <div className="text-[10px] text-emerald-300">
                      Périmètre : {hoveredDam.irrigationPerimeter[lang] || hoveredDam.irrigationPerimeter.fr}
                    </div>
                  </div>
                )}

                {hoveredPivot && !hoveredDam && (
                  <div className="space-y-1">
                    <span className="font-bold text-amber-400 block text-sm">
                      🌀 {hoveredPivot.name[lang] || hoveredPivot.name.fr}
                    </span>
                    <div className="text-[11px] text-slate-300">
                      {hoveredPivot.totalPivotsCount.toLocaleString()} Pivots | <strong>{hoveredPivot.totalAreaHa.toLocaleString()} ha</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Nappe : {hoveredPivot.aquiferSource} (Puits: {hoveredPivot.averageWellDepthM}m)
                    </div>
                  </div>
                )}

                {hoveredWilaya && !hoveredDam && !hoveredPivot && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                      <span className="font-bold text-emerald-400 text-sm">
                        {hoveredWilaya.codeStr} - {hoveredWilaya.nameFr} ({hoveredWilaya.nameAr})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-0.5">
                      <div>Sol: <strong className="text-white">{hoveredWilaya.soilNameFr}</strong></div>
                      <div>Pluviométrie: <strong className="text-white">{hoveredWilaya.rainfallMm} mm/an</strong></div>
                      <div className="text-emerald-300">{hoveredWilaya.keyProduceFr}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SVG MAP */}
            <svg
              viewBox="0 0 800 800"
              className="h-full w-full transition-transform duration-75"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
              onClick={handleMapClick}
            >
              <defs>
                {/* Algeria National Border Clip Path */}
                <clipPath id="algeria-national-clip">
                  <path d={nationalPath} />
                </clipPath>

                {/* Glow Filter for Active / Hovered Wilayas */}
                <filter id="wilaya-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
                </filter>

                {/* Mediterranean Sea Gradient */}
                <linearGradient id="med-sea-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
                </linearGradient>

                {/* Chott Saline Gradient */}
                <linearGradient id="chott-saline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
                </linearGradient>

                {/* Base Land Fill by Theme */}
                <linearGradient id="algeria-base-land" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={
                      baseMapTheme === 'satellite_tone'
                        ? '#064e3b'
                        : baseMapTheme === 'topographic'
                        ? '#d97706'
                        : '#f8fafc'
                    }
                    stopOpacity={baseMapTheme === 'vector' ? 0.3 : 0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      baseMapTheme === 'satellite_tone'
                        ? '#78350f'
                        : baseMapTheme === 'topographic'
                        ? '#b45309'
                        : '#f1f5f9'
                    }
                    stopOpacity={baseMapTheme === 'vector' ? 0.4 : 0.9}
                  />
                </linearGradient>
              </defs>

              {/* 1. Mediterranean Sea Background & Maritime Shelf */}
              <g id="mediterranean-sea">
                <path
                  d="M 180 0 L 800 0 L 800 135 L 755 130 Q 640 100 500 102 Q 380 108 300 138 Q 230 165 210 180 Z"
                  fill="url(#med-sea-gradient)"
                />
                <text
                  x="520"
                  y="45"
                  fill="#0284c7"
                  fontSize="11"
                  fontWeight="700"
                  letterSpacing="2"
                  textAnchor="middle"
                  opacity="0.75"
                >
                  MER MÉDITERRANÉE / البحر الأبيض المتوسط
                </text>

                {/* Major Coastal Ports & Maritime Gateways */}
                <g id="mediterranean-ports" opacity="0.6">
                  <circle cx="498" cy="104" r="2.5" fill="#0284c7" />
                  <text x="498" y="98" fill="#0369a1" fontSize="7" fontWeight="bold" textAnchor="middle">
                    Alger (16)
                  </text>

                  <circle cx="360" cy="148" r="2.5" fill="#0284c7" />
                  <text x="360" y="142" fill="#0369a1" fontSize="7" fontWeight="bold" textAnchor="middle">
                    Oran (31)
                  </text>

                  <circle cx="682" cy="118" r="2.5" fill="#0284c7" />
                  <text x="682" y="112" fill="#0369a1" fontSize="7" fontWeight="bold" textAnchor="middle">
                    Annaba (23)
                  </text>

                  <circle cx="585" cy="110" r="2.5" fill="#0284c7" />
                  <text x="585" y="104" fill="#0369a1" fontSize="7" fontWeight="bold" textAnchor="middle">
                    Béjaïa (06)
                  </text>
                </g>
              </g>

              {/* 2. Neighboring Countries Labels & Outer Boundaries */}
              <g id="neighboring-countries" pointerEvents="none" opacity="0.45">
                <text x="750" y="195" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                  TUNISIE / تونس
                </text>
                <text x="755" y="380" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                  LIBYE / ليبيا
                </text>
                <text x="650" y="760" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                  NIGER / النيجر
                </text>
                <text x="330" y="775" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                  MALI / مالي
                </text>
                <text x="110" y="580" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                  MAURITANIE / موريتانيا
                </text>
                <text x="190" y="240" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                  MAROC / المغرب
                </text>
              </g>

              {/* 3. Base Land Fill Polygon for Algeria */}
              <path
                id="algeria-base-land-path"
                d={nationalPath}
                fill="url(#algeria-base-land)"
                stroke={baseMapTheme === 'satellite_tone' ? '#047857' : '#94a3b8'}
                strokeWidth={1.5}
              />

              {/* 4. 58-WILAYA GRANULAR CHOROPLETH POLYGON CELLS (Clipped to Algeria National Border) */}
              {showWilayaPolygons && (
                <g id="algeria-wilayas-polygons" clipPath="url(#algeria-national-clip)">
                  {wilayaPolygons.map((poly) => {
                    const w = poly.wilayaData;
                    const isSelected = w.code === selectedWilayaCode;
                    const isHovered =
                      hoveredPolygonCode === w.code || hoveredWilaya?.code === w.code;
                    const color = getWilayaColor(w);

                    // Opacity based on map theme and layer
                    const fillOpacity = isSelected
                      ? 0.95
                      : isHovered
                      ? 0.85
                      : baseMapTheme === 'satellite_tone'
                      ? 0.65
                      : baseMapTheme === 'topographic'
                      ? 0.72
                      : 0.82;

                    return (
                      <path
                        key={`poly-${poly.code}`}
                        d={poly.polygonPath}
                        fill={color}
                        fillOpacity={fillOpacity}
                        stroke={
                          isSelected
                            ? '#ffffff'
                            : isHovered
                            ? '#38bdf8'
                            : baseMapTheme === 'satellite_tone'
                            ? 'rgba(255,255,255,0.25)'
                            : 'rgba(255,255,255,0.45)'
                        }
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2.0 : 0.75}
                        filter={isSelected || isHovered ? 'url(#wilaya-glow)' : undefined}
                        className="cursor-pointer transition-colors duration-150"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWilayaClick(w);
                        }}
                        onMouseEnter={() => {
                          setHoveredPolygonCode(w.code);
                          setHoveredWilaya(w);
                        }}
                        onMouseLeave={() => {
                          setHoveredPolygonCode(null);
                          setHoveredWilaya(null);
                        }}
                      >
                        <title>
                          {w.codeStr} - {lang === 'ar' ? w.nameAr : w.nameFr} | {w.soilNameFr} ({w.rainfallMm} mm)
                        </title>
                      </path>
                    );
                  })}
                </g>
              )}

              {/* 5. TOPOGRAPHIC RELIEF & HYDROGRAPHY (Mountains, Chotts, Wadis, Ergs) */}
              {showTopography && (
                <g id="algeria-topography" clipPath="url(#algeria-national-clip)" pointerEvents="none">
                  {/* Mountain Relief Ranges */}
                  <g id="mountain-ranges" opacity={baseMapTheme === 'vector' ? 0.35 : 0.65}>
                    {[...TOPOGRAPHIC_RELIEF_DATA.tellAtlas, ...TOPOGRAPHIC_RELIEF_DATA.saharanAtlas, ...TOPOGRAPHIC_RELIEF_DATA.hoggarTassili].map((rangePath, idx) => (
                      <path
                        key={`range-${idx}`}
                        d={rangePath}
                        fill="none"
                        stroke="#78350f"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeDasharray={idx < TOPOGRAPHIC_RELIEF_DATA.tellAtlas.length ? '6 2' : '8 3'}
                      />
                    ))}
                  </g>

                  {/* Chotts & Sebkhas (Endorheic Salt Lakes) */}
                  <g id="chotts-and-sebkhas">
                    {TOPOGRAPHIC_RELIEF_DATA.majorChotts.map((chott) => (
                      <g key={chott.id}>
                        <path
                          d={chott.path}
                          fill="url(#chott-saline-gradient)"
                          stroke={chott.color || '#0284c7'}
                          strokeWidth={1}
                          strokeDasharray="3 1"
                        />
                        <text
                          fill="#0369a1"
                          fontSize="6.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="dark:fill-sky-200"
                        >
                          {lang === 'ar' ? chott.nameAr : chott.nameFr}
                        </text>
                      </g>
                    ))}
                  </g>

                  {/* Major Wadis & River Networks */}
                  <g id="major-wadis" opacity="0.6">
                    {TOPOGRAPHIC_RELIEF_DATA.majorWadis.map((wadi) => (
                      <path
                        key={wadi.id}
                        d={wadi.path}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                      />
                    ))}
                  </g>

                  {/* Sand Dune Ergs Formations */}
                  <g id="desert-ergs" opacity="0.4">
                    {TOPOGRAPHIC_RELIEF_DATA.desertErgs.map((erg) => (
                      <g key={erg.id}>
                        <path
                          d={erg.path}
                          fill={erg.color || '#f59e0b'}
                          fillOpacity={0.45}
                          stroke="#f59e0b"
                          strokeWidth={1}
                          strokeDasharray="4 2"
                        />
                      </g>
                    ))}
                  </g>
                </g>
              )}

              {/* 6. Optional Macro Regional Ecological Zones Overlay */}
              {showMacroBands && (
                <g id="algeria-macro-regions" pointerEvents="none" opacity="0.25">
                  <path
                    d="M 210 180 Q 500 110 755 130 L 720 180 Q 500 160 300 200 Z"
                    fill="#059669"
                  />
                  <path
                    d="M 300 200 Q 500 160 720 180 L 690 265 Q 500 250 340 280 Z"
                    fill="#d97706"
                  />
                  <path
                    d="M 340 280 Q 500 250 690 265 L 710 360 Q 520 345 390 375 Z"
                    fill="#ea580c"
                  />
                  <path
                    d="M 390 375 Q 520 345 710 360 L 720 720 Q 500 820 320 650 L 260 420 Z"
                    fill="#dc2626"
                  />
                </g>
              )}

              {/* 7. National Perimeter Border Crisp Line */}
              <path
                id="algeria-national-border-line"
                d={nationalPath}
                fill="none"
                stroke={baseMapTheme === 'satellite_tone' ? '#10b981' : '#334155'}
                strokeWidth={2.2}
                pointerEvents="none"
              />

              {/* 8. Wilayas Centroid Nodes & Labels */}
              {showWilayaLabels && (
                <g id="algeria-wilayas-nodes">
                  {filteredWilayas.map((w) => {
                    const pt = projectCoordinates(w.lat, w.lng);
                    const isSelected = w.code === selectedWilayaCode;
                    const isHovered =
                      hoveredPolygonCode === w.code || hoveredWilaya?.code === w.code;
                    const color = getWilayaColor(w);

                    return (
                      <g
                        key={w.code}
                        className="cursor-pointer transition-transform duration-150"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWilayaClick(w);
                        }}
                        onMouseEnter={() => {
                          setHoveredPolygonCode(w.code);
                          setHoveredWilaya(w);
                        }}
                        onMouseLeave={() => {
                          setHoveredPolygonCode(null);
                          setHoveredWilaya(null);
                        }}
                      >
                        {isSelected && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={16}
                            fill={color}
                            fillOpacity={0.4}
                            className="animate-ping"
                          />
                        )}

                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 9 : isHovered ? 8 : 5.5}
                          fill={isSelected ? '#ffffff' : color}
                          stroke={isSelected ? color : '#ffffff'}
                          strokeWidth={isSelected ? 2.5 : 1}
                          className="transition-all drop-shadow-md"
                        />

                        <text
                          x={pt.x}
                          y={pt.y + 3}
                          fill={isSelected ? color : '#ffffff'}
                          fontSize={isSelected ? '7.5' : '5.5'}
                          fontWeight="800"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {w.codeStr}
                        </text>

                        <text
                          x={pt.x + 8}
                          y={pt.y + 2.5}
                          fill={
                            isSelected
                              ? '#0f172a'
                              : baseMapTheme === 'satellite_tone'
                              ? '#f8fafc'
                              : '#334155'
                          }
                          fontSize={isSelected ? '9.5' : '7'}
                          fontWeight={isSelected ? '800' : '600'}
                          className="dark:fill-slate-100 select-none pointer-events-none drop-shadow-sm"
                        >
                          {lang === 'ar' ? w.nameAr : w.nameFr}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* OVERLAY LAYER 1: DAMS & WATER RESERVOIRS */}
              {showDamsOverlay && (
                <g id="layer-dams-markers">
                  {ALGERIA_MAJOR_DAMS.map((dam) => {
                    const pt = projectCoordinates(dam.geoCoords.lat, dam.geoCoords.lng);
                    return (
                      <g
                        key={dam.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredDam(dam)}
                        onMouseLeave={() => setHoveredDam(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWilayaCode(dam.wilayaCode);
                        }}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={9}
                          fill="#0284c7"
                          fillOpacity={0.85}
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="animate-pulse"
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 3}
                          fontSize="9"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          💧
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* OVERLAY LAYER 2: SOUTHERN CENTER-PIVOTS */}
              {showPivotsOverlay && (
                <g id="layer-pivots-markers">
                  {ALGERIA_PIVOT_CLUSTERS.map((pivot) => {
                    const pt = projectCoordinates(pivot.geoCoords.lat, pivot.geoCoords.lng);
                    return (
                      <g
                        key={pivot.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPivot(pivot)}
                        onMouseLeave={() => setHoveredPivot(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWilayaCode(pivot.wilayaCode);
                        }}
                      >
                        {/* Concentric Pivot Circle Simulation */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={14}
                          fill="#10b981"
                          fillOpacity={0.3}
                          stroke="#10b981"
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={5}
                          fill="#d97706"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                        {/* Rotating Pivot Arm */}
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x + 10}
                          y2={pt.y - 10}
                          stroke="#059669"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* OVERLAY LAYER 3: CCLS SILOS & SUPPLY CHAIN */}
              {showCclsOverlay && (
                <g id="layer-ccls-markers">
                  {ALGERIA_CCLS_SILOS.map((silo) => {
                    const pt = projectCoordinates(silo.geoCoords.lat, silo.geoCoords.lng);
                    return (
                      <g
                        key={silo.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredSilo(silo)}
                        onMouseLeave={() => setHoveredSilo(null)}
                      >
                        <rect
                          x={pt.x - 7}
                          y={pt.y - 7}
                          width={14}
                          height={14}
                          rx={3}
                          fill="#16a34a"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 3.5}
                          fontSize="8"
                          fill="#ffffff"
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          🌾
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* OVERLAY LAYER 4: LOCUST SURVEILLANCE RADAR */}
              {showLocustOverlay && (
                <g id="layer-locust-markers">
                  {ALGERIA_LOCUST_ZONES.map((zone) => {
                    const pt = projectCoordinates(zone.geoCoords.lat, zone.geoCoords.lng);
                    return (
                      <g
                        key={zone.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredLocust(zone)}
                        onMouseLeave={() => setHoveredLocust(null)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={20}
                          fill={zone.color}
                          fillOpacity={0.2}
                          stroke={zone.color}
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={7}
                          fill={zone.color}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 3}
                          fontSize="8"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          🦗
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* OVERLAY LAYER 5: SATELLITE NDVI BIOPHYSICAL GRID */}
              {showSatelliteGridOverlay && (
                <g id="layer-sat-grid">
                  {ALGERIA_SATELLITE_GRID.map((node) => {
                    const pt = projectCoordinates(node.geoCoords.lat, node.geoCoords.lng);
                    const color =
                      node.ndviSentinel2 >= 0.65
                        ? '#059669'
                        : node.ndviSentinel2 >= 0.4
                        ? '#10b981'
                        : node.ndviSentinel2 >= 0.2
                        ? '#f59e0b'
                        : '#94a3b8';
                    return (
                      <g
                        key={node.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredSatPoint(node)}
                        onMouseLeave={() => setHoveredSatPoint(null)}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={6}
                          fill={color}
                          fillOpacity={0.8}
                          stroke="#ffffff"
                          strokeWidth={1}
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* DRAWN USER CAD PARCELS & PIVOTS */}
              {drawnPlots.map((plot) => {
                if (plot.shapeType === 'polygon' && plot.vertices.length > 2) {
                  const pointsStr = plot.vertices
                    .map((v) => {
                      const pt = projectCoordinates(v.lat, v.lng);
                      return `${pt.x},${pt.y}`;
                    })
                    .join(' ');

                  return (
                    <g key={plot.id}>
                      <polygon
                        points={pointsStr}
                        fill="#10b981"
                        fillOpacity={0.35}
                        stroke="#059669"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                      {plot.vertices.map((v, i) => {
                        const pt = projectCoordinates(v.lat, v.lng);
                        return (
                          <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r={4}
                            fill="#047857"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                          />
                        );
                      })}
                    </g>
                  );
                } else if (plot.shapeType === 'center_pivot' && plot.pivotCenter) {
                  const pt = projectCoordinates(plot.pivotCenter.lat, plot.pivotCenter.lng);
                  return (
                    <g key={plot.id}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={22}
                        fill="#10b981"
                        fillOpacity={0.35}
                        stroke="#047857"
                        strokeWidth={2}
                      />
                      <circle cx={pt.x} cy={pt.y} r={4} fill="#047857" />
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {/* Dynamic Map Legend for Soil Zones & Layers */}
            <AlgeriaMapDynamicLegend
              activeLayer={activeLayer}
              filterSoil={filterSoil}
              onSelectSoilFilter={(soilId) => setFilterSoil(soilId)}
              selectedWilaya={selectedWilaya}
              onSelectWilaya={(code) => setSelectedWilayaCode(code)}
              onOpenRegionalPopup={(w, zone) => {
                if (w) {
                  setSelectedWilayaCode(w.code);
                  setPopupSelectedWilaya(w);
                }
                if (zone) setPopupSelectedZone(zone);
                setIsRegionalPopupOpen(true);
              }}
              selectedCropId={selectedCropId}
              isExpanded={isLegendExpanded}
              onToggleExpanded={setIsLegendExpanded}
              storageKey="algeria_agri_map_legend_expanded"
            />
          </div>
        </div>

        {/* Right Column: Wilaya Detail Card & Live Weather (4 Cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {lang === 'ar' ? 'الولاية المحددة' : 'Wilaya Sélectionnée'}
                </span>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                  {selectedWilaya.codeStr} - {lang === 'ar' ? selectedWilaya.nameAr : selectedWilaya.nameFr}
                </h3>
              </div>
              <span className="rounded-xl bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {selectedWilaya.zone.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'التربة السائدة' : 'Type de Sol'}</span>
                <strong className="text-slate-800 dark:text-slate-100 truncate block">
                  {selectedWilaya.soilNameFr}
                </strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'الأمطار السنوية' : 'Pluviométrie'}</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {selectedWilaya.rainfallMm} mm/an
                </strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'المناخ الحيوي' : 'Bioclimat'}</span>
                <strong className="text-slate-800 dark:text-slate-100 capitalize">
                  {selectedWilaya.bioclimate.replace('_', ' ')}
                </strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'الحوض أو السد' : 'Bassin / Barrage'}</span>
                <strong className="text-sky-600 dark:text-sky-400 truncate block">
                  {selectedWilaya.damOrBasinFr}
                </strong>
              </div>
            </div>

            {/* Live Weather Forecast Card */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-md">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {lang === 'ar' ? 'الطقس الفضائي المباشر (Open-Meteo)' : 'Météo Satellitaire en Direct'}
                  </span>
                </div>
                {weatherData.loading && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                )}
              </div>

              {weatherData.loading ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  {lang === 'ar' ? 'جاري جلب بيانات الطقس الحية...' : 'Chargement météo temps réel...'}
                </div>
              ) : weatherData.current ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-white">
                        {Math.round(weatherData.current.temperature)}°C
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {lang === 'ar' ? 'المحسوسة:' : 'Ressentie :'} {Math.round(weatherData.current.apparentTemperature)}°C
                      </span>
                    </div>
                    <div className="text-right text-xs space-y-0.5 text-slate-300">
                      <div>💧 {weatherData.current.relativeHumidity}%</div>
                      <div>💨 {weatherData.current.windSpeed10m} km/h</div>
                      <div>🌧️ {weatherData.current.precipitation} mm</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-slate-400">
                  {lang === 'ar' ? 'تعذر جلب الطقس المباشر' : 'Données météo satellite indisponibles'}
                </div>
              )}
            </div>

            {/* Regional Statistics Popup Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setPopupSelectedWilaya(selectedWilaya);
                setPopupSelectedZone(selectedWilaya.zone);
                setIsRegionalPopupOpen(true);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Info className="h-4 w-4" />
              <span>
                {lang === 'ar'
                  ? 'عرض بطاقة الإحصائيات الإقليمية الشاملة'
                  : 'Fiche Complète des Statistiques Régionales'}
              </span>
              <ChevronRight className="h-4 w-4 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced GIS & Agro-Decision Intelligence Suite */}
      <AlgeriaAdvancedGISTools
        currentWilayaCode={selectedWilayaCode}
        onSelectWilaya={(code) => setSelectedWilayaCode(code)}
        drawnPlots={drawnPlots}
        activePlot={activePlot}
        onUpdateActivePlot={setActivePlot}
        onSavePlot={handleSavePlot}
        onDeletePlot={handleDeletePlot}
        isDrawingMode={isDrawingMode}
        setIsDrawingMode={setIsDrawingMode}
      />

      {/* Regional & Pedological Statistics Popup Modal */}
      <AlgeriaRegionalStatsPopup
        isOpen={isRegionalPopupOpen}
        onClose={() => setIsRegionalPopupOpen(false)}
        wilaya={popupSelectedWilaya || selectedWilaya}
        zone={popupSelectedZone || selectedWilaya.zone}
        onSelectWilaya={(code) => {
          setSelectedWilayaCode(code);
          const found = ALL_58_WILAYAS.find((w) => w.code === code);
          if (found) {
            setPopupSelectedWilaya(found);
            setPopupSelectedZone(found.zone);
          }
        }}
        weatherData={weatherData}
      />
    </div>
  );
}
