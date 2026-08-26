'use client';

import React, { useState, useMemo } from 'react';
import {
  Maximize2,
  Minimize2,
  Trash2,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  MapPin,
  Sparkles,
  Layers,
  Compass,
  FileCode,
  Share2,
  Droplets,
  Sprout,
  Activity,
  Calculator,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { useLanguageStore, type Language } from '@/lib/language-store';
import { ALL_58_WILAYAS, type WilayaDataFull } from '@/lib/algeria-wilayas-58';
import { ALGERIA_MAJOR_DAMS, ALGERIA_CCLS_SILOS, type DamData, type CclsSiloData } from '@/lib/algeria-gis-layers-data';
import { ALGERIA_AQUIFER_SYSTEMS, type AquiferSystem } from '@/lib/algeria-advanced-gis-data';

export interface PlotVertex {
  id: string;
  lat: number;
  lng: number;
  xPct: number; // 0-100% on map canvas
  yPct: number;
}

export type PlotShapeType = 'polygon' | 'center_pivot';

export interface DrawnPlot {
  id: string;
  name: string;
  shapeType: PlotShapeType;
  cropType: string;
  vertices: PlotVertex[];
  pivotCenter?: PlotVertex;
  pivotRadiusMeters?: number;
  calculatedAreaHa: number;
  calculatedPerimeterM: number;
  createdAt: string;
}

interface PlotDrawerModalProps {
  drawnPlots: DrawnPlot[];
  activePlot: DrawnPlot | null;
  onUpdateActivePlot: (plot: DrawnPlot | null) => void;
  onSavePlot: (plot: DrawnPlot) => void;
  onDeletePlot: (id: string) => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  drawingShape: PlotShapeType;
  setDrawingShape: (shape: PlotShapeType) => void;
  currentWilayaCode: number;
  onSelectWilaya: (code: number) => void;
}

export default function AlgeriaPlotDrawerModal({
  drawnPlots,
  activePlot,
  onUpdateActivePlot,
  onSavePlot,
  onDeletePlot,
  isDrawingMode,
  setIsDrawingMode,
  drawingShape,
  setDrawingShape,
  currentWilayaCode,
  onSelectWilaya,
}: PlotDrawerModalProps) {
  const { language } = useLanguageStore();
  const lang: Language = language || 'fr';

  const [plotName, setPlotName] = useState('Parcelle Nord 01');
  const [selectedCrop, setSelectedCrop] = useState('Blé Dur (Bousselam)');
  const [irrigationType, setIrrigationType] = useState('Pivot d’aspersion');
  const [pivotRadiusInput, setPivotRadiusInput] = useState(250); // 250m radius = ~19.6 ha

  // Sample Presets for quick demonstration
  const samplePresets: {
    name: string;
    shapeType: PlotShapeType;
    wilayaCode: number;
    crop: string;
    areaHa: number;
    perimeterM: number;
    vertices: PlotVertex[];
    pivotCenter?: PlotVertex;
    pivotRadiusMeters?: number;
  }[] = [
    {
      name: 'Adrar Cereal Pivot 04 (Tsabit)',
      shapeType: 'center_pivot',
      wilayaCode: 1,
      crop: 'Blé Dur de Semence',
      areaHa: 50.2,
      perimeterM: 2513,
      pivotRadiusMeters: 400,
      pivotCenter: { id: 'p1', lat: 27.92, lng: -0.28, xPct: 31, yPct: 64 },
      vertices: [],
    },
    {
      name: 'Sersou High Plains Wheat Perimeter (Tiaret)',
      shapeType: 'polygon',
      wilayaCode: 14,
      crop: 'Blé Tendre & Orge',
      areaHa: 84.6,
      perimeterM: 3720,
      vertices: [
        { id: 'v1', lat: 35.42, lng: 1.35, xPct: 43.5, yPct: 28.2 },
        { id: 'v2', lat: 35.48, lng: 1.42, xPct: 44.8, yPct: 27.5 },
        { id: 'v3', lat: 35.45, lng: 1.55, xPct: 46.2, yPct: 28.0 },
        { id: 'v4', lat: 35.38, lng: 1.48, xPct: 45.1, yPct: 29.1 },
      ],
    },
    {
      name: 'Biskra Early Greenhouse Complex (El Ghrous)',
      shapeType: 'polygon',
      wilayaCode: 7,
      crop: 'Tomate & Poivron sous serre',
      areaHa: 14.8,
      perimeterM: 1540,
      vertices: [
        { id: 'v1', lat: 34.82, lng: 5.65, xPct: 69.2, yPct: 35.8 },
        { id: 'v2', lat: 34.86, lng: 5.72, xPct: 70.1, yPct: 35.2 },
        { id: 'v3', lat: 34.83, lng: 5.78, xPct: 70.8, yPct: 36.1 },
        { id: 'v4', lat: 34.79, lng: 5.71, xPct: 69.9, yPct: 36.6 },
      ],
    },
    {
      name: 'Mitidja Citrus & Drip Orchard (Blida)',
      shapeType: 'polygon',
      wilayaCode: 9,
      crop: 'Agrumes (Clémentine / Thomson)',
      areaHa: 32.5,
      perimeterM: 2280,
      vertices: [
        { id: 'v1', lat: 36.48, lng: 2.82, xPct: 51.5, yPct: 20.1 },
        { id: 'v2', lat: 36.52, lng: 2.91, xPct: 52.4, yPct: 19.6 },
        { id: 'v3', lat: 36.49, lng: 2.98, xPct: 53.1, yPct: 20.4 },
        { id: 'v4', lat: 36.44, lng: 2.89, xPct: 52.2, yPct: 20.9 },
      ],
    },
  ];

  const currentWilaya = useMemo(() => {
    return ALL_58_WILAYAS.find((w) => w.code === currentWilayaCode) || ALL_58_WILAYAS[0];
  }, [currentWilayaCode]);

  // Find Nearest Dam
  const nearestDam = useMemo(() => {
    let bestDist = Infinity;
    let bestDam = ALGERIA_MAJOR_DAMS[0];
    const wLat = currentWilaya.lat;
    const wLng = currentWilaya.lng;
    ALGERIA_MAJOR_DAMS.forEach((d) => {
      const dist = Math.sqrt(Math.pow(d.geoCoords.lat - wLat, 2) + Math.pow(d.geoCoords.lng - wLng, 2)) * 111;
      if (dist < bestDist) {
        bestDist = dist;
        bestDam = d;
      }
    });
    return { dam: bestDam, distanceKm: Math.round(bestDist) };
  }, [currentWilaya]);

  // Find Nearest CCLS Silo
  const nearestSilo = useMemo(() => {
    let bestDist = Infinity;
    let bestSilo = ALGERIA_CCLS_SILOS[0];
    const wLat = currentWilaya.lat;
    const wLng = currentWilaya.lng;
    ALGERIA_CCLS_SILOS.forEach((s) => {
      const dist = Math.sqrt(Math.pow(s.geoCoords.lat - wLat, 2) + Math.pow(s.geoCoords.lng - wLng, 2)) * 111;
      if (dist < bestDist) {
        bestDist = dist;
        bestSilo = s;
      }
    });
    return { silo: bestSilo, distanceKm: Math.round(bestDist) };
  }, [currentWilaya]);

  // Find Aquifer
  const aquifer = useMemo(() => {
    return ALGERIA_AQUIFER_SYSTEMS.find((a) => a.coverageWilayas.includes(currentWilayaCode)) || ALGERIA_AQUIFER_SYSTEMS[0];
  }, [currentWilayaCode]);

  // Active or mock area in hectares
  const activeAreaHa = activePlot ? activePlot.calculatedAreaHa : 45.0;

  // Agricultural Yield & Water Need Estimate
  const estimatedWaterM3 = useMemo(() => {
    // 5500 m3/ha for cereal / oasis crops
    return Math.round(activeAreaHa * 5500);
  }, [activeAreaHa]);

  const estimatedYieldTons = useMemo(() => {
    // 4.5 tons/ha average for irrigated cereal
    return Math.round(activeAreaHa * 4.5);
  }, [activeAreaHa]);

  const estimatedFertilizerUreaKg = useMemo(() => {
    // 250 kg/ha Urea
    return Math.round(activeAreaHa * 250);
  }, [activeAreaHa]);

  const estimatedFertilizerTspKg = useMemo(() => {
    // 150 kg/ha TSP
    return Math.round(activeAreaHa * 150);
  }, [activeAreaHa]);

  // Load a preset
  const handleLoadPreset = (preset: typeof samplePresets[0]) => {
    const newPlot: DrawnPlot = {
      id: `plot_${Date.now()}`,
      name: preset.name,
      shapeType: preset.shapeType,
      cropType: preset.crop,
      vertices: preset.vertices,
      pivotCenter: preset.pivotCenter,
      pivotRadiusMeters: preset.pivotRadiusMeters,
      calculatedAreaHa: preset.areaHa,
      calculatedPerimeterM: preset.perimeterM,
      createdAt: new Date().toISOString(),
    };
    onSavePlot(newPlot);
    onUpdateActivePlot(newPlot);
    onSelectWilaya(preset.wilayaCode);
  };

  // Export GeoJSON
  const handleExportGeoJSON = () => {
    const plot = activePlot || drawnPlots[0];
    if (!plot) return;

    let geoJsonData: any;
    if (plot.shapeType === 'polygon') {
      const coordinates = plot.vertices.map((v) => [v.lng, v.lat]);
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]); // close polygon loop
      }
      geoJsonData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: plot.name,
              crop: plot.cropType,
              areaHectares: plot.calculatedAreaHa,
              perimeterMeters: plot.calculatedPerimeterM,
              wilaya: currentWilaya.nameFr,
              wilayaCode: currentWilaya.code,
              soil: currentWilaya.soilNameFr,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [coordinates],
            },
          },
        ],
      };
    } else {
      geoJsonData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: plot.name,
              shape: 'center_pivot',
              radiusMeters: plot.pivotRadiusMeters || 400,
              areaHectares: plot.calculatedAreaHa,
              crop: plot.cropType,
              wilaya: currentWilaya.nameFr,
            },
            geometry: {
              type: 'Point',
              coordinates: [plot.pivotCenter?.lng || currentWilaya.lng, plot.pivotCenter?.lat || currentWilaya.lat],
            },
          },
        ],
      };
    }

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plot.name.replace(/\s+/g, '_')}_cad.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export KML
  const handleExportKML = () => {
    const plot = activePlot || drawnPlots[0];
    if (!plot) return;

    let kmlCoordinates = '';
    if (plot.shapeType === 'polygon') {
      kmlCoordinates = plot.vertices.map((v) => `${v.lng},${v.lat},0`).join(' ');
      if (plot.vertices.length > 0) {
        kmlCoordinates += ` ${plot.vertices[0].lng},${plot.vertices[0].lat},0`;
      }
    } else {
      const lat = plot.pivotCenter?.lat || currentWilaya.lat;
      const lng = plot.pivotCenter?.lng || currentWilaya.lng;
      kmlCoordinates = `${lng},${lat},0`;
    }

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${plot.name}</name>
    <Placemark>
      <name>${plot.name}</name>
      <description>Culture: ${plot.cropType} | Surface: ${plot.calculatedAreaHa} ha | Wilaya: ${currentWilaya.nameFr}</description>
      ${
        plot.shapeType === 'polygon'
          ? `<Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${kmlCoordinates}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>`
          : `<Point>
        <coordinates>${kmlCoordinates}</coordinates>
      </Point>`
      }
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plot.name.replace(/\s+/g, '_')}.kml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 p-4 text-white shadow-md border border-emerald-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              📐
            </span>
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'أداة رسم وحساب مساحة الحقول والرشاشات المحورية' : 'Dessinateur CAD & SIG de Parcelles et Pivots'}
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            {lang === 'ar'
              ? 'ارسم حدود مزرعتك أو محيط الرشاش المحوري، واحسب المساحة (هكتار) واحتياجات المياه والأسمدة، مع التصدير إلى GeoJSON و KML'
              : 'Tracez vos contours parcellaires ou pivots, calculez la superficie (ha), périmètre (m), besoins en eau et exportez vers QGIS / Google Earth.'}
          </p>
        </div>

        {/* Drawing Mode Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md ${
              isDrawingMode
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 animate-pulse'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {isDrawingMode
                ? lang === 'ar'
                  ? 'وضع الرسم نشط (انقر على الخريطة)'
                  : 'Mode Dessin Actif (Cliquez sur la carte)'
                : lang === 'ar'
                ? 'تفعيل وضع الرسم على الخريطة'
                : 'Activer le Traçage sur Carte'}
            </span>
          </button>
        </div>
      </div>

      {/* Preset Fast Loader */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          {lang === 'ar' ? 'نماذج حقول ومشاريع محورية جاهزة للتجربة:' : 'Exemples de Parcelles & Méga-Pivots Pré-configurés :'}
        </span>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="flex flex-col text-left rounded-xl border border-slate-200 bg-slate-50/70 p-3 hover:bg-emerald-50/60 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 transition-all group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                  {preset.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold shrink-0">
                  {preset.areaHa} ha
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                🌱 {preset.crop}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {preset.shapeType === 'center_pivot' ? '🌀 Pivot Circulaire (R = 400m)' : '📐 Polygone Géodésique'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Parcel Intelligence Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Dimensions & Agricultural Calculator */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {lang === 'ar' ? 'البيانات الفنية والاحتياجات الزراعية' : 'Indicateurs Agronomiques de la Parcelle'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {activeAreaHa.toFixed(1)} Hectares ({Math.round(activeAreaHa * 10000).toLocaleString()} m²)
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block">
                {lang === 'ar' ? 'المساحة الإجمالية' : 'Superficie Totale'}
              </span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {activeAreaHa.toFixed(1)} ha
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block">
                {lang === 'ar' ? 'المحيط الخارجي' : 'Périmètre Estimé'}
              </span>
              <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {activePlot ? activePlot.calculatedPerimeterM.toLocaleString() : '2,400'} m
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block">
                {lang === 'ar' ? 'الإنتاج التقديري' : 'Rendement Estimé'}
              </span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                ~{estimatedYieldTons} t
              </span>
            </div>

            <div className="rounded-xl bg-sky-50/70 p-3 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40">
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 block">
                {lang === 'ar' ? 'حجم مياه السقي السنوي' : 'Besoin en Eau (Annuel)'}
              </span>
              <span className="text-base font-extrabold text-sky-700 dark:text-sky-300">
                {estimatedWaterM3.toLocaleString()} m³
              </span>
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                {lang === 'ar' ? 'سماد اليوريا (46% N)' : 'Urée 46% Recommandée'}
              </span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                {estimatedFertilizerUreaKg.toLocaleString()} kg
              </span>
            </div>

            <div className="rounded-xl bg-purple-50/70 p-3 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40">
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block">
                {lang === 'ar' ? 'سماد الفوسفات (TSP 46%)' : 'TSP 46% Recommandé'}
              </span>
              <span className="text-base font-extrabold text-purple-700 dark:text-purple-300">
                {estimatedFertilizerTspKg.toLocaleString()} kg
              </span>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleExportGeoJSON}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export GeoJSON (QGIS)</span>
            </button>
            <button
              onClick={handleExportKML}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export KML (Google Earth)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Local Soil & Geodata Spatial Query */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {lang === 'ar' ? 'التقاطع المكاني مع البنية التحتية والتربة' : 'Croisement Spatial & Infrastructures Locales'}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {currentWilaya.codeStr} - {currentWilaya.nameFr}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'التربة السائدة بالمنطقة:' : 'Pédologie & Sol dominant :'}
              </span>
              <strong className="text-slate-800 dark:text-slate-100">{currentWilaya.soilNameFr}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'المائدة المائية الجوفية:' : 'Système Aquifère Sous-jacent :'}
              </span>
              <strong className="text-emerald-700 dark:text-emerald-300">{aquifer.name[lang] || aquifer.name.fr}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'أقرب سد مائي رئيسي (ANBT):' : 'Barrage ANBT le plus proche :'}
              </span>
              <div className="text-right">
                <strong className="text-sky-700 dark:text-sky-300 block">{nearestDam.dam.name[lang] || nearestDam.dam.name.fr}</strong>
                <span className="text-[10px] text-slate-400">~{nearestDam.distanceKm} km (Taux remplissage: {nearestDam.dam.currentFillRatePct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'أقرب صومعة تخزين حبوب (CCLS):' : 'Silo Céréalier CCLS le plus proche :'}
              </span>
              <div className="text-right">
                <strong className="text-amber-700 dark:text-amber-300 block">{nearestSilo.silo.name[lang] || nearestSilo.silo.name.fr}</strong>
                <span className="text-[10px] text-slate-400">~{nearestSilo.distanceKm} km (Capacité: {nearestSilo.silo.storageCapacityTons.toLocaleString()} t)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
