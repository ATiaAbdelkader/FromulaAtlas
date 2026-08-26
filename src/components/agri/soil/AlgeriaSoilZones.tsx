'use client';

import React, { useState, useMemo } from 'react';
import {
  Mountain,
  Layers,
  MapPin,
  TrendingUp,
  Droplets,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sprout,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Flame,
  Wheat,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Check,
  Scale,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  ALGERIA_SOIL_ZONES,
  getAlgeriaSoilZoneById,
  calculateSoilCalibratedYield,
  calculateDynamicYieldCrossReference,
  REGIONAL_CROP_BENCHMARKS,
  getRegionalCropBenchmark,
  type AlgeriaSoilZone,
  type AlgeriaSoilClass,
  type RegionalCropBenchmark,
  type DynamicYieldCrossReferenceResult,
} from '@/lib/algeria-soil-zones-data';
import {
  ALL_58_WILAYAS,
  SOIL_CLASSES_INFO,
  projectCoordinates,
  type WilayaDataFull,
} from '@/lib/algeria-map-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface AlgeriaSoilZonesProps {
  initialZoneId?: string;
  onSelectZone?: (zone: AlgeriaSoilZone) => void;
  onApplyYieldToField?: (calibratedYieldTonsHa: number, zone: AlgeriaSoilZone) => void;
  className?: string;
}

export function AlgeriaSoilZones({
  initialZoneId = 'mitidja_vertisols',
  onSelectZone,
  onApplyYieldToField,
  className = '',
}: AlgeriaSoilZonesProps) {
  const { language, isRTL } = useTranslation();
  const tr = copyFor;

  // Active zone & search state
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId);
  const [selectedSoilClassFilter, setSelectedSoilClassFilter] = useState<string>('all');
  const [searchWilaya, setSearchWilaya] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');
  const [hoveredMapSoil, setHoveredMapSoil] = useState<AlgeriaSoilClass | null>(null);
  const [hoveredMapWilaya, setHoveredMapWilaya] = useState<WilayaDataFull | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(true);
  
  // Dynamic Cross-Reference Inputs
  const [selectedCropId, setSelectedCropId] = useState<string>('wheat_durum');
  const [waterRegime, setWaterRegime] = useState<'rainfed' | 'supplemental' | 'full_irrigated'>('supplemental');
  
  // Custom calibration modifiers
  const [enableCustomOverrides, setEnableCustomOverrides] = useState<boolean>(false);
  const [customSalinityDsm, setCustomSalinityDsm] = useState<number>(1.2);
  const [customOrganicMatterPct, setCustomOrganicMatterPct] = useState<number>(1.8);
  const [hasSubsoiling, setHasSubsoiling] = useState<boolean>(true);
  const [hasOrganicAmendment, setHasOrganicAmendment] = useState<boolean>(true);
  const [appliedFeedback, setAppliedFeedback] = useState<boolean>(false);

  // Selected Zone object
  const activeZone: AlgeriaSoilZone = useMemo(() => {
    return getAlgeriaSoilZoneById(selectedZoneId);
  }, [selectedZoneId]);

  // Filtered zones list
  const filteredZones = useMemo(() => {
    return ALGERIA_SOIL_ZONES.filter((z) => {
      const matchesClass = selectedSoilClassFilter === 'all' || z.soilClass === selectedSoilClassFilter;
      const matchesSearch =
        !searchWilaya ||
        z.provinces.some((p) => p.toLowerCase().includes(searchWilaya.toLowerCase())) ||
        z.name.en.toLowerCase().includes(searchWilaya.toLowerCase()) ||
        z.name.fr.toLowerCase().includes(searchWilaya.toLowerCase()) ||
        z.name.ar.includes(searchWilaya);
      return matchesClass && matchesSearch;
    });
  }, [selectedSoilClassFilter, searchWilaya]);

  // Handle Zone Selection
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const z = getAlgeriaSoilZoneById(zoneId);
    setCustomSalinityDsm(z.electricalConductivityDsm);
    setCustomOrganicMatterPct(z.organicMatterPct);
    onSelectZone?.(z);
  };

  // Dynamic Cross-Referencing Yield Calculation
  const dynamicYieldResult: DynamicYieldCrossReferenceResult = useMemo(() => {
    return calculateDynamicYieldCrossReference(
      selectedCropId,
      selectedZoneId,
      waterRegime,
      enableCustomOverrides
        ? {
            customSoilSalinityDsm: customSalinityDsm,
            customOrganicMatterPct: customOrganicMatterPct,
            hasSubsoiling: hasSubsoiling,
            hasOrganicAmendment: hasOrganicAmendment,
          }
        : undefined
    );
  }, [
    selectedCropId,
    selectedZoneId,
    waterRegime,
    enableCustomOverrides,
    customSalinityDsm,
    customOrganicMatterPct,
    hasSubsoiling,
    hasOrganicAmendment,
  ]);

  // Format currency
  const formatDzd = (val: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Chart data comparing national mean, regional benchmark, dynamic calibrated yield, and genetic ceiling
  const comparativeChartData = useMemo(() => {
    return [
      {
        name: tr(language, 'National Mean', 'المعدل الوطني', 'Moyenne Nat.'),
        yieldTons: dynamicYieldResult.nationalMeanTonsHa,
        fill: '#94a3b8', // slate-400
      },
      {
        name: tr(language, 'Regional Bench', 'المعيار الإقليمي', 'Repère Régional'),
        yieldTons: dynamicYieldResult.regionalBenchmarkTonsHa,
        fill: '#3b82f6', // blue-500
      },
      {
        name: tr(language, 'Dynamic Potential', 'المردود الديناميكي', 'Potentiel Dynamique'),
        yieldTons: dynamicYieldResult.dynamicYieldTonsHa,
        fill: dynamicYieldResult.yieldGapDeltaTonsHa >= 0 ? '#10b981' : '#f59e0b', // emerald or amber
      },
      {
        name: tr(language, 'Genetic Ceiling', 'السقف الوراثي', 'Plafond Génétique'),
        yieldTons: dynamicYieldResult.geneticPotentialCeilingTonsHa,
        fill: '#8b5cf6', // purple-500
      },
    ];
  }, [dynamicYieldResult, language, tr]);

  // Apply Yield action
  const handleApplyYield = () => {
    onApplyYieldToField?.(dynamicYieldResult.dynamicYieldTonsHa, activeZone);
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  // Risk badges styling
  const getRiskBadge = (level: string, label: string) => {
    switch (level) {
      case 'none':
      case 'low':
        return (
          <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {label}: {tr(language, 'Low / None', 'منخفض / منعدم', 'Faible / Nul')}
          </Badge>
        );
      case 'moderate':
        return (
          <Badge className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            {label}: {tr(language, 'Moderate', 'متوسط', 'Modéré')}
          </Badge>
        );
      case 'high':
      case 'very_high':
      case 'severe':
      default:
        return (
          <Badge className="border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            {label}: {tr(language, 'High / Critical', 'مرتفع / حرج', 'Élevé / Critique')}
          </Badge>
        );
    }
  };

  return (
    <div
      id="algeria-soil-zones-explorer"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`algeria-soil-zones-container space-y-6 rounded-3xl border border-emerald-200/80 bg-card p-4 shadow-sm sm:p-6 dark:border-emerald-900/80 ${className}`}
    >
      {/* Top Header Banner */}
      <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white shadow-md sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 font-bold text-black text-[11px] px-2 py-0.5">
                INRAA · BNEDER · FAO Pedology
              </Badge>
              <Badge className="bg-white/10 text-white border-white/20 text-[11px]">
                {tr(
                  language,
                  'Regional Benchmarks Cross-Referencing Engine',
                  'محرك مقاطعة المعايير الإقليمية لمردود المحاصيل',
                  'Moteur de Croisement des Repères Régionaux'
                )}
              </Badge>
            </div>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl flex items-center gap-2.5">
              <Mountain className="h-6 w-6 text-emerald-400" />
              <span>
                {tr(
                  language,
                  'Algeria Soil Zones & Regional Yield Benchmark Calibrator',
                  'المناطق البيدولوجية للجزائر ومُعاير المردود حسب المعايير الإقليمية',
                  'Zones Pédologiques d’Algérie & Calibrateur de Rendement Régional'
                )}
              </span>
            </h2>
            <p className="max-w-3xl text-xs text-emerald-100/90 leading-relaxed sm:text-sm">
              {tr(
                language,
                'Cross-reference provincial soil taxonomy (Mitidja Vertisols, High Plateaus Calcisols, Saharan Arenosols, Cheliff Fluvisols) with regional crop benchmarks to compute calibrated dynamic yield potential and economic revenue in DZD.',
                'قاطع تصنيفات التربة الإقليمية (تربة التيرس بالمتيجة، الكالسيسول بالهضاب العليا، رمال العرق الصحراوية، وفلوفيسول الشلف) مع المعايير الإقليمية لتقدير المردود الديناميكي والعائد المالي بالدينار الجزائري.',
                'Croisez les sols provinciaux (Vertisols de la Mitidja, Calcisols des Hauts Plateaux, Arénosols sahariens, Fluvisols du Chéliff) avec les repères régionaux pour évaluer le rendement dynamique et les revenus en DZD.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleApplyYield}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md text-xs sm:text-sm rounded-xl px-4 py-2.5"
            >
              {appliedFeedback ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                  <span>{tr(language, 'Applied to Digital Twin!', 'تم التطبيق على التوأم الرقمي!', 'Appliqué au Jumeau !')}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    {tr(
                      language,
                      `Apply Yield (${dynamicYieldResult.dynamicYieldTonsHa} t/ha)`,
                      `تطبيق المردود المعاير (${dynamicYieldResult.dynamicYieldTonsHa} طن/هـ)`,
                      `Appliquer (${dynamicYieldResult.dynamicYieldTonsHa} t/ha)`
                    )}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & Wilaya Navigator */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Soil Class Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-foreground me-1 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            {tr(language, 'Soil Type:', 'نوع التربة:', 'Type de sol :')}
          </span>
          {[
            { id: 'all', label: tr(language, 'All Algeria Zones', 'جميع مناطق الجزائر', 'Toutes les zones') },
            { id: 'vertisol', label: tr(language, 'Vertisols (Mitidja)', 'فيرتيسول (متيجة)', 'Vertisols (Mitidja)') },
            { id: 'calcisol', label: tr(language, 'Calcisoils (Hauts Plateaux)', 'كالسيسول (الهضاب العليا)', 'Calcisols (Hauts Plateaux)') },
            { id: 'arenosol', label: tr(language, 'Arenosols (Desert Erg)', 'أرينوسول (رمال الصحراء)', 'Arénosols (Sable d’Erg)') },
            { id: 'fluvisol', label: tr(language, 'Fluvisols (Cheliff Valley)', 'فلوفيسول (وادي الشلف)', 'Fluvisols (Vallée du Chéliff)') },
            { id: 'solonchak', label: tr(language, 'Solonchaks (Saline Chotts)', 'سولونشاك (شطوط ملحية)', 'Solonchaks (Sols salés)') },
            { id: 'luvisol', label: tr(language, 'Luvisols (Terra Rossa)', 'لوفيسول (تيرا روزا الحمراء)', 'Luvisols (Terra Rossa)') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedSoilClassFilter(item.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedSoilClassFilter === item.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-background p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🗺️ {tr(language, 'Interactive Map & Legend', 'الخريطة والدليل الديناميكي', 'Carte & Légende')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📋 {tr(language, 'Zone Cards', 'بطاقات المناطق', 'Fiches Zones')}
            </button>
          </div>

          {/* Wilaya / Province Search */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder={tr(language, 'Search Wilaya...', 'ابحث بالولاية...', 'Chercher une wilaya...')}
              value={searchWilaya}
              onChange={(e) => setSearchWilaya(e.target.value)}
              className="h-8 w-full rounded-xl border border-input bg-background px-3 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: INTERACTIVE VECTOR MAP & DYNAMIC HOVER LEGEND */}
      {viewMode === 'map' && (
        <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-sky-50/40 via-background to-emerald-50/20 p-3 sm:p-5 shadow-sm dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            {/* SVG Map Canvas */}
            <div className="relative min-h-[460px] w-full rounded-2xl bg-card border border-border p-2 overflow-hidden flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 800 800" className="h-full w-full max-h-[520px]">
                <defs>
                  <filter id="subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <style>
                    {`
                      @keyframes zoneRipple {
                        0% { r: 8px; opacity: 0.8; stroke-width: 2px; }
                        50% { r: 18px; opacity: 0.35; stroke-width: 1.5px; }
                        100% { r: 24px; opacity: 0; stroke-width: 0.5px; }
                      }
                      .zone-pulse-wave {
                        animation: zoneRipple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
                        transform-origin: center;
                        pointer-events: none;
                      }
                      @keyframes nodeGentlePulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.18); }
                      }
                      .node-active-pulse {
                        animation: nodeGentlePulse 2.4s ease-in-out infinite;
                        transform-box: fill-box;
                        transform-origin: center;
                      }
                    `}
                  </style>
                </defs>

                {/* Mediterranean Sea outline */}
                <path d="M 280 80 Q 500 50 760 80 L 760 10 L 280 10 Z" fill="#38bdf8" fillOpacity="0.12" />
                <text x="500" y="50" fill="#0284c7" fontSize="10" fontWeight="700" textAnchor="middle" opacity="0.6">
                  MER MÉDITERRANÉE / البحر الأبيض المتوسط
                </text>

                {/* Macro-Geographic Belts */}
                <g id="algeria-macro-geography" opacity="0.75">
                  <path d="M 320 130 Q 500 100 740 105 L 720 150 Q 500 140 330 155 Z" fill="#059669" fillOpacity="0.25" stroke="#059669" strokeWidth="1" strokeDasharray="3 2" />
                  <path d="M 330 155 Q 500 140 720 150 L 680 230 Q 500 220 370 240 Z" fill="#d97706" fillOpacity="0.25" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" />
                  <path d="M 370 240 Q 500 220 680 230 L 750 360 Q 500 340 320 370 Z" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                  <path d="M 320 370 Q 500 340 750 360 L 620 740 L 450 780 L 220 540 Z" fill="#78716c" fillOpacity="0.15" stroke="#78716c" strokeWidth="1" strokeDasharray="3 2" />
                </g>

                {/* Wilaya Nodes with Pedological Colors */}
                <g id="algeria-wilayas-nodes">
                  {ALL_58_WILAYAS.map((w) => {
                    const pt = projectCoordinates(w.lat, w.lng);
                    const soilInfo = SOIL_CLASSES_INFO[w.dominantSoil];
                    const color = soilInfo ? soilInfo.color : '#059669';

                    // Check matching filter or hover
                    const isFiltered = selectedSoilClassFilter === 'all' || w.dominantSoil === selectedSoilClassFilter;
                    if (!isFiltered) return null;

                    const isHovered = hoveredMapWilaya?.code === w.code;
                    const isSelectedZone =
                      activeZone.soilClass === w.dominantSoil ||
                      activeZone.provinces.some((p) => p.toLowerCase().includes(w.nameFr.toLowerCase()));
                    const isSoilHighlighted =
                      hoveredMapSoil === w.dominantSoil ||
                      (hoveredMapWilaya && hoveredMapWilaya.dominantSoil === w.dominantSoil);
                    const isDimmed = hoveredMapSoil && w.dominantSoil !== hoveredMapSoil;

                    return (
                      <g
                        key={w.code}
                        className="cursor-pointer transition-all duration-200"
                        style={{ opacity: isDimmed ? 0.25 : 1 }}
                        onClick={() => {
                          // Find corresponding zone
                          const matchedZone = ALGERIA_SOIL_ZONES.find(
                            (z) => z.soilClass === w.dominantSoil || z.provinces.some((p) => p.toLowerCase().includes(w.nameFr.toLowerCase()))
                          );
                          if (matchedZone) handleSelectZone(matchedZone.id);
                        }}
                        onMouseEnter={() => {
                          setHoveredMapWilaya(w);
                          setHoveredMapSoil(w.dominantSoil);
                        }}
                        onMouseLeave={() => {
                          setHoveredMapWilaya(null);
                          setHoveredMapSoil(null);
                        }}
                      >
                        {/* Subtle Pulsing Ripple Ring for Hovered Node or Selected Zone on Hover */}
                        {(isHovered || (isSoilHighlighted && isHovered)) && (
                          <>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={10}
                              fill="none"
                              stroke={color}
                              strokeWidth={2}
                              className="zone-pulse-wave"
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={16}
                              fill={color}
                              fillOpacity={0.25}
                              className="animate-ping"
                              style={{ animationDuration: '1.8s' }}
                            />
                          </>
                        )}

                        {/* Ambient Pulsing Aura for all nodes in the highlighted soil zone */}
                        {isSoilHighlighted && !isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={13}
                            fill={color}
                            fillOpacity={0.28}
                            stroke="#ffffff"
                            strokeWidth={1.2}
                            strokeDasharray="2 2"
                            className="animate-pulse"
                            style={{ animationDuration: '2s' }}
                          />
                        )}

                        {/* Selected Zone Persistent Subtle Indicator */}
                        {isSelectedZone && !isSoilHighlighted && !isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={11}
                            fill="none"
                            stroke={color}
                            strokeWidth={1.5}
                            strokeDasharray="3 2"
                            opacity={0.8}
                          />
                        )}

                        {/* Wilaya Node Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 10.5 : isSoilHighlighted ? 8.5 : isSelectedZone ? 8 : 7}
                          fill={color}
                          stroke={isHovered || isSoilHighlighted ? '#ffffff' : isSelectedZone ? '#f8fafc' : '#1e293b'}
                          strokeWidth={isHovered ? 2.5 : isSoilHighlighted ? 2 : 1}
                          filter={isHovered ? 'url(#subtle-glow)' : undefined}
                          className={`drop-shadow-md transition-all duration-200 ${
                            isHovered ? 'node-active-pulse' : ''
                          }`}
                        />

                        {/* Wilaya Code Badge */}
                        <text
                          x={pt.x}
                          y={pt.y + 3.5}
                          fill="#ffffff"
                          fontSize={isHovered ? '8.5' : '6.5'}
                          fontWeight="800"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {w.codeStr}
                        </text>

                        {/* Wilaya Name Label */}
                        <text
                          x={pt.x + 9}
                          y={pt.y + 3}
                          fill={isHovered ? '#047857' : isSoilHighlighted ? '#065f46' : '#475569'}
                          fontSize={isHovered ? '9.5' : isSoilHighlighted ? '8.5' : '7.5'}
                          fontWeight={isHovered || isSoilHighlighted ? '800' : '600'}
                          className="dark:fill-slate-200 select-none pointer-events-none drop-shadow-xs"
                        >
                          {language === 'ar' ? w.nameAr : w.nameFr}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Dynamic Interactive Legend & Pedological Inspector Panel */}
            <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
              <div className="space-y-3">
                {/* Legend Header */}
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-foreground">
                      {tr(
                        language,
                        'Dynamic Soil Zones Legend & Pedological Classifier',
                        'دليل المناطق البيدولوجية الديناميكي والمفسر العلمي',
                        'Légende Dynamique des Sols & Classificateur Pédologique'
                      )}
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    FAO · INRAA
                  </Badge>
                </div>

                {/* Live Hover Status */}
                <div className="rounded-xl bg-muted/60 p-2.5 text-xs border border-border/80">
                  {hoveredMapWilaya ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          📍 {hoveredMapWilaya.codeStr} - {language === 'ar' ? hoveredMapWilaya.nameAr : hoveredMapWilaya.nameFr}
                        </strong>
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-bold text-white uppercase"
                          style={{ backgroundColor: SOIL_CLASSES_INFO[hoveredMapWilaya.dominantSoil]?.color || '#059669' }}
                        >
                          {hoveredMapWilaya.dominantSoil}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {SOIL_CLASSES_INFO[hoveredMapWilaya.dominantSoil]?.name[language] ||
                          SOIL_CLASSES_INFO[hoveredMapWilaya.dominantSoil]?.name.en}
                      </p>
                    </div>
                  ) : hoveredMapSoil ? (
                    <div className="flex items-center justify-between">
                      <strong className="text-foreground">
                        🔍 {SOIL_CLASSES_INFO[hoveredMapSoil]?.name[language] || SOIL_CLASSES_INFO[hoveredMapSoil]?.name.en}
                      </strong>
                      <span className="text-[11px] text-emerald-600 font-bold">
                        {ALL_58_WILAYAS.filter((w) => w.dominantSoil === hoveredMapSoil).length}{' '}
                        {tr(language, 'Wilayas', 'ولاية', 'Wilayas')}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground italic">
                      {tr(
                        language,
                        'Hover over any Wilaya on the map or click a soil class below to inspect pedological properties.',
                        'مرّر مؤشر الفأرة على أي ولاية بالخريطة أو اختر نوع التربة أدناه لشرح خصائصها البيدولوجية بالتفصيل.',
                        'Survolez une wilaya sur la carte ou choisissez une classe de sol pour afficher son analyse.'
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Soil Diagnostic Card for Active/Hovered Soil */}
                {(() => {
                  const targetSoilKey: AlgeriaSoilClass =
                    hoveredMapSoil || (hoveredMapWilaya ? hoveredMapWilaya.dominantSoil : (activeZone.soilClass as AlgeriaSoilClass) || 'vertisol');
                  const info = SOIL_CLASSES_INFO[targetSoilKey];
                  if (!info) return null;

                  const matchingWilayas = ALL_58_WILAYAS.filter((w) => w.dominantSoil === targetSoilKey);

                  return (
                    <div
                      className="rounded-2xl border p-3.5 text-xs space-y-2.5 transition-all shadow-xs"
                      style={{
                        backgroundColor: `${info.color}10`,
                        borderColor: `${info.color}40`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: info.color }} />
                          <strong className="text-sm font-black text-foreground">
                            {info.name[language] || info.name.en}
                          </strong>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {matchingWilayas.length} {tr(language, 'provinces', 'ولاية', 'wilayas')}
                        </span>
                      </div>

                      <p className="text-[11px] text-foreground/90 leading-relaxed">
                        {info.description[language] || info.description.en}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg bg-background/80 p-2 border border-border">
                          <span className="text-muted-foreground font-medium block">
                            {tr(language, 'Texture:', 'القوام:', 'Texture :')}
                          </span>
                          <strong className="text-foreground">{info.texture}</strong>
                        </div>
                        <div className="rounded-lg bg-background/80 p-2 border border-border">
                          <span className="text-muted-foreground font-medium block">
                            {tr(language, 'Major Vulnerability:', 'المحدد الرئيسي:', 'Contrainte :')}
                          </span>
                          <span className="text-amber-700 dark:text-amber-400 font-semibold truncate block">
                            {info.keyChallenge[language] || info.keyChallenge.en}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/80 p-2 border border-border text-[11px]">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
                          🌱 {tr(language, 'Agronomic Recommendation:', 'التوصية الزراعية:', 'Recommandation :')}
                        </span>
                        <p className="text-muted-foreground">
                          {info.recommendedAmendments[language] || info.recommendedAmendments.en}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Color-Coded Soil Class Badges Grid */}
              <div className="space-y-1.5 border-t border-border pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {tr(language, 'Color-Coded Soil Taxonomies (Click to Filter):', 'ألوان تصنيف التربة (اضغط للتصفية):', 'Taxonomies des sols (cliquez pour filtrer) :')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(SOIL_CLASSES_INFO) as AlgeriaSoilClass[]).map((key) => {
                    const s = SOIL_CLASSES_INFO[key];
                    const isCurrent =
                      hoveredMapSoil === key ||
                      (hoveredMapWilaya && hoveredMapWilaya.dominantSoil === key);

                    return (
                      <button
                        key={key}
                        type="button"
                        onMouseEnter={() => setHoveredMapSoil(key)}
                        onMouseLeave={() => setHoveredMapSoil(null)}
                        onClick={() => setSelectedSoilClassFilter(selectedSoilClassFilter === key ? 'all' : key)}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-start text-xs transition-all border ${
                          isCurrent || selectedSoilClassFilter === key
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold dark:bg-emerald-950/60 dark:text-emerald-100 shadow-sm'
                            : 'border-border bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: s.color }} />
                        <span className="truncate">{s.name[language]?.split('(')[0] || s.name.en.split('(')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Horizontal Province & Zone Selector Grid */}
      {viewMode === 'cards' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredZones.map((zone) => {
            const isSelected = zone.id === selectedZoneId;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleSelectZone(zone.id)}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-start transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20 dark:bg-emerald-950/40'
                    : 'border-border bg-card hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                      {zone.soilClass.toUpperCase()}
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {zone.coordinates.lat}°N, {zone.coordinates.lng}°E
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-foreground">
                    {zone.name[language] || zone.name.en}
                  </h4>
                  <p className="mt-1 text-xs italic text-emerald-700 dark:text-emerald-300">
                    {zone.localPedologicalTerm[language] || zone.localPedologicalTerm.en}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {zone.provinces.slice(0, 3).map((w) => (
                      <span key={w} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-foreground font-medium">
                        {w}
                      </span>
                    ))}
                    {zone.provinces.length > 3 && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        +{zone.provinces.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-1 border-t border-border/80 pt-2.5 text-center text-[10px]">
                  <div className="rounded-lg bg-background p-1 border">
                    <div className="text-muted-foreground font-medium">{tr(language, 'Clay', 'طين', 'Argile')}</div>
                    <strong className="text-foreground">{zone.clayPct}%</strong>
                  </div>
                  <div className="rounded-lg bg-background p-1 border">
                    <div className="text-muted-foreground font-medium">pH</div>
                    <strong className="text-foreground">{zone.phH2O}</strong>
                  </div>
                  <div className="rounded-lg bg-background p-1 border">
                    <div className="text-muted-foreground font-medium">CaCO₃</div>
                    <strong className="text-foreground">{zone.activeLimeCaCO3Pct}%</strong>
                  </div>
                  <div className="rounded-lg bg-background p-1 border">
                    <div className="text-muted-foreground font-medium">ECe</div>
                    <strong className="text-foreground">{zone.electricalConductivityDsm} dS/m</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Two-Column Detailed Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.15fr]">
        
        {/* Left Column: Pedological Profile, Texture & Horizons */}
        <div className="space-y-4">
          
          {/* Active Zone Detail Card */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {tr(language, 'Active Pedological Profile', 'الملف البيدولوجي النشط', 'Profil Pédologique Actif')}
                </span>
                <h3 className="text-lg font-black text-foreground">
                  {activeZone.name[language] || activeZone.name.en}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeZone.regionName[language] || activeZone.regionName.en}
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1">
                {activeZone.soilClass.toUpperCase()}
              </Badge>
            </div>

            {/* Wilayas Covered */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{tr(language, 'Covered Provinces:', 'الولايات المشمولة:', 'Wilayas couvertes :')}</span>
              {activeZone.provinces.map((w) => (
                <span key={w} className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-semibold">
                  {w}
                </span>
              ))}
            </div>

            {/* Soil Texture & Physical Properties Breakdown */}
            <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  {tr(language, 'Texture Composition (Granulometry):', 'التركيبة الحبيبية والقوام:', 'Granulométrie & Texture :')}
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {activeZone.textureLabel[language] || activeZone.textureLabel.en}
                </span>
              </div>

              {/* Granulometry Bar */}
              <div className="space-y-1">
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
                  <div style={{ width: `${activeZone.clayPct}%` }} className="bg-amber-700" title={`Clay: ${activeZone.clayPct}%`} />
                  <div style={{ width: `${activeZone.siltPct}%` }} className="bg-amber-400" title={`Silt: ${activeZone.siltPct}%`} />
                  <div style={{ width: `${activeZone.sandPct}%` }} className="bg-yellow-200" title={`Sand: ${activeZone.sandPct}%`} />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-700 inline-block" />{tr(language, 'Clay', 'طين', 'Argile')} {activeZone.clayPct}%</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />{tr(language, 'Silt', 'طمي', 'Limon')} {activeZone.siltPct}%</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-200 inline-block" />{tr(language, 'Sand', 'رمل', 'Sable')} {activeZone.sandPct}%</span>
                </div>
              </div>

              {/* Physical & Chemical Key Indicators Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 pt-2 text-xs">
                <div className="rounded-lg bg-background p-2 border">
                  <span className="text-[10px] text-muted-foreground">{tr(language, 'Soil pH (H₂O)', 'حموضة التربة pH', 'pH du sol')}</span>
                  <div className="text-sm font-black text-foreground">{activeZone.phH2O}</div>
                  <span className="text-[9px] text-muted-foreground">
                    {activeZone.phH2O > 8.0 ? tr(language, 'Alkaline Calcareous', 'قلوي كلسي', 'Alcalin calcaire') : tr(language, 'Neutral / Balanced', 'متعادل ومتوازن', 'Neutre équilibré')}
                  </span>
                </div>

                <div className="rounded-lg bg-background p-2 border">
                  <span className="text-[10px] text-muted-foreground">{tr(language, 'Active Lime (CaCO₃)', 'الكلس النشط', 'Calcaire actif')}</span>
                  <div className="text-sm font-black text-foreground">{activeZone.activeLimeCaCO3Pct}%</div>
                  <span className="text-[9px] text-muted-foreground">
                    {activeZone.activeLimeCaCO3Pct > 15 ? tr(language, 'High Chlorosis Risk', 'خطر اصفرار مرتفع', 'Risque chlorose fort') : tr(language, 'Safe Buffer', 'نطاق آمن', 'Zone tolérée')}
                  </span>
                </div>

                <div className="rounded-lg bg-background p-2 border">
                  <span className="text-[10px] text-muted-foreground">{tr(language, 'Organic Matter (SOM)', 'المادة العضوية', 'Matière organique')}</span>
                  <div className="text-sm font-black text-foreground">{activeZone.organicMatterPct}%</div>
                  <span className="text-[9px] text-muted-foreground">
                    {activeZone.organicMatterPct >= 2.0 ? tr(language, 'Humus Rich', 'غنية بالدبال', 'Riche en humus') : tr(language, 'Depleted (<1%)', 'فقيرة (<1%)', 'Faible (<1%)')}
                  </span>
                </div>

                <div className="rounded-lg bg-background p-2 border">
                  <span className="text-[10px] text-muted-foreground">{tr(language, 'Cation Exchange (CEC)', 'سعة التبادل الكاتيوني', 'Capacité CEC')}</span>
                  <div className="text-sm font-black text-foreground">{activeZone.cecMeq100g} <span className="text-[10px] font-normal">meq/100g</span></div>
                  <span className="text-[9px] text-muted-foreground">
                    {activeZone.cecMeq100g > 30 ? tr(language, 'Very High Holding', 'تخزين غذائي هائل', 'Très forte rétention') : tr(language, 'Low Holding', 'تخزين ضعيف', 'Faible rétention')}
                  </span>
                </div>

                <div className="rounded-lg bg-background p-2 border">
                  <span className="text-[10px] text-muted-foreground">{tr(language, 'Water Capacity (AWC)', 'الاحتفاظ المائي المفيد', 'Réserve utile (RU)')}</span>
                  <div className="text-sm font-black text-foreground">{activeZone.availableWaterCapacityMmPerM} <span className="text-[10px] font-normal">mm/m</span></div>
                  <span className="text-[9px] text-muted-foreground">{tr(language, 'Useful soil buffer', 'المخزون المائي المفيد', 'Réserve du sol')}</span>
                </div>

                <div className="rounded-lg bg-background p-2 border">
                  <span className="text-[10px] text-muted-foreground">{tr(language, 'Infiltration Rate', 'سرعة النفاذية والترشيح', 'Vitesse d’infiltration')}</span>
                  <div className="text-sm font-black text-foreground">{activeZone.infiltrationRateMmh} <span className="text-[10px] font-normal">mm/h</span></div>
                  <span className="text-[9px] text-muted-foreground">
                    {activeZone.infiltrationRateMmh > 50 ? tr(language, 'Ultra-fast drainage', 'ترشيح فائق السرعة', 'Drainage très rapide') : tr(language, 'Slow infiltration', 'نفاذية بطيئة', 'Infiltration lente')}
                  </span>
                </div>
              </div>
            </div>

            {/* Agronomic Vulnerability & Risk Badges */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {tr(language, 'Pedological Constraints & Risk Signals:', 'المحددات البيدولوجية ومؤشرات المخاطر:', 'Contraintes et facteurs de risque :')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {getRiskBadge(activeZone.swellingShrinkageRisk, tr(language, 'Cracking / Shrinkage', 'التشقق والتقلص', 'Retrait / Gonflement'))}
                {getRiskBadge(activeZone.waterloggingRisk, tr(language, 'Waterlogging', 'التغدق والاختناق', 'Asphyxie hydrique'))}
                {getRiskBadge(activeZone.chlorosisRisk, tr(language, 'Iron Chlorosis', 'الاصفرار الكلوروزي', 'Chlorose ferrique'))}
                {getRiskBadge(activeZone.salinityRisk, tr(language, 'Salinity / Sodicity', 'الملوحة والصودية', 'Salinité / Sodicité'))}
                {getRiskBadge(activeZone.compactionRisk, tr(language, 'Compaction Hardpan', 'الانضغاط والطبقة الصماء', 'Compactage'))}
                {getRiskBadge(activeZone.erosionRisk, tr(language, 'Erosion Vulnerability', 'قابلية الانجراف', 'Érosion'))}
              </div>
            </div>

            {/* Soil Horizons Stratification Section */}
            <div className="mt-5 border-t border-border pt-4">
              <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600" />
                {tr(language, 'Soil Profile Horizons (Depth Strata):', 'طبقات وأفاق المقطع الترابي (العمق):', 'Horizons du profil pédologique :')}
              </h4>

              <div className="space-y-2.5">
                {activeZone.horizons.map((hz, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs"
                  >
                    <div className="sm:w-36 shrink-0">
                      <div className="font-extrabold text-foreground">{hz.horizon}</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {hz.depthCm}
                      </Badge>
                    </div>
                    <div className="flex-1 text-muted-foreground leading-relaxed">
                      {hz.description[language] || hz.description.en}
                    </div>
                    <div className="flex sm:flex-col gap-2 sm:gap-1 text-[10px] text-muted-foreground shrink-0 sm:text-end">
                      <span>OM: <b className="text-foreground">{hz.organicMatterPct}%</b></span>
                      <span>Clay: <b className="text-foreground">{hz.clayPct}%</b></span>
                      <span>pH: <b className="text-foreground">{hz.ph}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Actionable Agronomic Guidelines for this Soil */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-600" />
              {tr(language, 'Soil Management & Agronomic Prescriptions:', 'إرشادات الإدارة والتطبيقات الزراعية:', 'Recommandations agronomiques de gestion :')}
            </h4>

            <div className="grid gap-3 text-xs">
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="font-bold text-emerald-800 dark:text-emerald-200 mb-1">
                  🚜 {tr(language, 'Tillage & Seedbed Preparation', 'الحراثة وإعداد مهد البذور', 'Labour & Préparation du sol')}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {activeZone.tillageGuidance[language] || activeZone.tillageGuidance.en}
                </p>
              </div>

              <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 p-3 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="font-bold text-blue-800 dark:text-blue-200 mb-1">
                  💧 {tr(language, 'Irrigation Delivery & Frequency', 'نظام وتواتر الري', 'Régime et fréquence d’irrigation')}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {activeZone.irrigationGuidance[language] || activeZone.irrigationGuidance.en}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="font-bold text-amber-800 dark:text-amber-200 mb-1">
                  🧪 {tr(language, 'Nutrient & Soil Amendment Strategy', 'استراتيجية التسميد والمحسنات', 'Amendements & Stratégie nutritive')}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {activeZone.nutrientAmendmentGuidance[language] || activeZone.nutrientAmendmentGuidance.en}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-900/20">
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                  🌊 {tr(language, 'Drainage & Erosion Mitigation', 'الصرف ومكافحة الانجراف', 'Drainage & Protection contre l’érosion')}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {activeZone.drainageGuidance[language] || activeZone.drainageGuidance.en}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Yield Potential & Regional Benchmarks Cross-Reference Engine */}
        <div className="space-y-4">
          
          {/* Main Calculation Controller Card */}
          <div className="rounded-2xl border border-emerald-400/80 bg-card p-4 sm:p-5 shadow-sm dark:border-emerald-700/80">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  {tr(language, 'Dynamic Cross-Referencing Engine', 'محرك مقاطعة المردود الديناميكي', 'Moteur de Croisement Dynamique')}
                </span>
                <h3 className="text-base font-extrabold text-foreground mt-0.5">
                  {tr(language, 'Soil Zone × Regional Benchmark Calibrator', 'معاير المردود بمقاطعة التربة مع المعايير الإقليمية', 'Calibrateur Sol × Repères Régionaux')}
                </h3>
              </div>
              <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1">
                {dynamicYieldResult.yieldPotentialIndexPct}% {tr(language, 'of Genetic Ceiling', 'من السقف الوراثي', 'du plafond génétique')}
              </Badge>
            </div>

            {/* Crop Selection & Category Badges */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wheat className="h-3.5 w-3.5 text-emerald-600" />
                    {tr(language, 'Select Benchmark Crop (OAIC / MADR Standards):', 'اختر المحصول المرجعي (معايير OAIC ووزارة الفلاحة):', 'Culture cible (Normes OAIC / MADR) :')}
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {tr(language, 'Official price:', 'السعر الرسمي:', 'Prix officiel :')} <b className="text-emerald-600">{formatDzd(dynamicYieldResult.officialPricePerQx)} DZD/Qx</b>
                  </span>
                </label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold"
                >
                  {REGIONAL_CROP_BENCHMARKS.map((crop) => (
                    <option key={crop.cropId} value={crop.cropId}>
                      {crop.emoji} {crop.name[language] || crop.name.en} ({formatDzd(crop.officialSupportPriceDzdQx)} DZD/Qx)
                    </option>
                  ))}
                </select>
              </div>

              {/* Water Regime 3-Way Selector */}
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                  <Droplets className="h-3.5 w-3.5 text-blue-600" />
                  {tr(language, 'Water Delivery Regime:', 'نظام التزويد المائي:', 'Régime d’apport hydrique :')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'rainfed',
                      label: tr(language, 'Rainfed (Bour)', 'مطري (بعلي / بور)', 'Pluvial (Bour)'),
                      icon: '🌧️',
                      sub: tr(language, 'Natural rainfall only', 'الأمطار الطبيعية فقط', 'Pluie seule'),
                    },
                    {
                      id: 'supplemental',
                      label: tr(language, 'Supplemental', 'ري تكميلي', 'D’appoint'),
                      icon: '💧',
                      sub: tr(language, 'Flowering / filling boost', 'سقي الإزهار والامتلاء', 'Stades critiques'),
                    },
                    {
                      id: 'full_irrigated',
                      label: tr(language, 'Full Irrigated / Pivot', 'ري كامل / محوري', 'Total / Pivot'),
                      icon: '🚰',
                      sub: tr(language, 'Full crop water need', 'تغطية كامل الاحتياج', 'Besoins 100%'),
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWaterRegime(item.id as any)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                        waterRegime === item.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-100'
                          : 'border-border bg-card hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="mt-1 text-[11px] font-bold">{item.label}</span>
                      <span className="text-[9px] opacity-75">{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Field Sliders Overrides */}
            <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
              <button
                type="button"
                onClick={() => setEnableCustomOverrides((prev) => !prev)}
                className="flex w-full items-center justify-between text-xs font-bold text-foreground hover:text-emerald-600"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                  {tr(language, 'Refine with Site-Specific Soil Test & Cultural Practices', 'تخصيص بمعطيات تحليل التربة والممارسات الميدانية', 'Ajuster avec analyses de sol & pratiques')}
                </span>
                {enableCustomOverrides ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {enableCustomOverrides && (
                <div className="mt-3 grid gap-3 border-t border-border/80 pt-3 sm:grid-cols-2 text-xs">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tr(language, 'Soil Salinity (ECe):', 'الملوحة ECe:', 'Salinité CEe :')}</span>
                      <strong>{customSalinityDsm.toFixed(1)} dS/m</strong>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="10.0"
                      step="0.1"
                      value={customSalinityDsm}
                      onChange={(e) => setCustomSalinityDsm(Number(e.target.value))}
                      className="mt-1.5 w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tr(language, 'Organic Matter (SOM):', 'المادة العضوية:', 'Matière organique :')}</span>
                      <strong>{customOrganicMatterPct.toFixed(1)} %</strong>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="4.0"
                      step="0.1"
                      value={customOrganicMatterPct}
                      onChange={(e) => setCustomOrganicMatterPct(Number(e.target.value))}
                      className="mt-1.5 w-full accent-emerald-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="subsoiling-cross-check"
                      checked={hasSubsoiling}
                      onChange={(e) => setHasSubsoiling(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    <label htmlFor="subsoiling-cross-check" className="text-xs font-semibold text-foreground cursor-pointer">
                      {tr(language, 'Deep subsoiling (+45 cm) executed', 'تم التفكيك العميق للتربة (+45 سم)', 'Sous-solage profond (+45 cm) réalisé')}
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="organic-amendment-check"
                      checked={hasOrganicAmendment}
                      onChange={(e) => setHasOrganicAmendment(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    <label htmlFor="organic-amendment-check" className="text-xs font-semibold text-foreground cursor-pointer">
                      {tr(language, 'Compost / Manure Bio-Amendment applied', 'إضافة سماد عضوي متحلل أو كومبوست', 'Apport de compost / fumier mûr')}
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Yield Potential Hero Result Box */}
            <div className="mt-5 rounded-2xl border border-emerald-400 bg-gradient-to-br from-emerald-50/95 via-teal-50/80 to-emerald-100/60 p-4 sm:p-5 dark:border-emerald-800 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-900/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  {tr(language, 'Dynamic Yield Potential Estimate', 'تقدير المردود الديناميكي المتوقع', 'Estimation du Rendement Dynamique')}
                </span>
                <Badge
                  className={`text-xs font-bold px-2.5 py-1 ${
                    dynamicYieldResult.yieldGapDeltaTonsHa >= 0
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {dynamicYieldResult.yieldGapDeltaTonsHa >= 0 ? (
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      +{dynamicYieldResult.yieldGapPct}% {tr(language, 'vs Regional Bench', 'مقارنة بالمعيار الإقليمي', 'vs repère régional')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      {dynamicYieldResult.yieldGapPct}% {tr(language, 'vs Regional Bench', 'مقارنة بالمعيار الإقليمي', 'vs repère régional')}
                    </span>
                  )}
                </Badge>
              </div>

              {/* Main Headline Output */}
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                  {dynamicYieldResult.dynamicYieldTonsHa}
                </span>
                <span className="text-lg font-bold text-muted-foreground">
                  {tr(language, 't / ha', 'طن / هكتار', 't / ha')}
                </span>
                <span className="rounded-lg bg-emerald-200/70 dark:bg-emerald-900/60 px-2 py-0.5 font-mono text-sm font-black text-emerald-950 dark:text-emerald-100">
                  = {dynamicYieldResult.dynamicYieldQxHa} {tr(language, 'Quintals/ha (قنطار)', 'قنطار/هكتار', 'Qx/ha')}
                </span>
              </div>

              {/* Benchmark Reference Sub-bar */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-emerald-200/80 pt-3 dark:border-emerald-900/60 sm:grid-cols-3">
                <div className="rounded-lg bg-background/80 p-2 border">
                  <div className="text-[10px] text-muted-foreground font-medium">{tr(language, 'Regional Benchmark', 'المعيار الإقليمي', 'Repère régional')}</div>
                  <div className="text-sm font-bold text-foreground">{dynamicYieldResult.regionalBenchmarkTonsHa} t/ha ({dynamicYieldResult.regionalBenchmarkQxHa} Qx)</div>
                </div>

                <div className="rounded-lg bg-background/80 p-2 border">
                  <div className="text-[10px] text-muted-foreground font-medium">{tr(language, 'National Baseline', 'المعدل الوطني', 'Moyenne nationale')}</div>
                  <div className="text-sm font-bold text-foreground">{dynamicYieldResult.nationalMeanTonsHa} t/ha</div>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-lg bg-background/80 p-2 border">
                  <div className="text-[10px] text-muted-foreground font-medium">{tr(language, 'Yield Gap Delta', 'الفارق الإنتاجي', 'Écart de rendement')}</div>
                  <div className={`text-sm font-black ${dynamicYieldResult.yieldGapDeltaTonsHa >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {dynamicYieldResult.yieldGapDeltaTonsHa >= 0 ? `+${dynamicYieldResult.yieldGapDeltaTonsHa}` : dynamicYieldResult.yieldGapDeltaTonsHa} t/ha
                  </div>
                </div>
              </div>

              {/* Financial Gross Valuation & Economic Delta Box */}
              <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-600" />
                    {tr(language, 'Estimated Gross Output Valuation:', 'القيمة المالية الإجمالية المقدرة للمحصول:', 'Valorisation brute de la production :')}
                  </span>
                  <span className="text-sm font-black text-amber-950 dark:text-amber-100">
                    {formatDzd(dynamicYieldResult.estimatedGrossRevenueDzdHa)} DZD / ha
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 border-t border-amber-200/60 pt-1.5 dark:border-amber-900/40">
                  <span>
                    {tr(language, 'Economic Gain vs Regional Benchmark:', 'الفارق المالي مقارنة بالمعيار الإقليمي:', 'Gain économique vs repère régional :')}
                  </span>
                  <b className={`font-mono ${dynamicYieldResult.economicGainOverBenchmarkDzdHa >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                    {dynamicYieldResult.economicGainOverBenchmarkDzdHa >= 0 ? `+${formatDzd(dynamicYieldResult.economicGainOverBenchmarkDzdHa)}` : formatDzd(dynamicYieldResult.economicGainOverBenchmarkDzdHa)} DZD / ha
                  </b>
                </div>
              </div>

              {/* Pedological Factors Waterfall breakdown */}
              <div className="mt-3 space-y-1.5 border-t border-emerald-200/80 pt-3 dark:border-emerald-900/60">
                <span className="text-[11px] font-bold text-foreground block mb-1">
                  {tr(language, 'Pedological Stress & Bonus Factors Breakdown:', 'تفصيل معاملات التأثير البيدولوجي والممارسات:', 'Facteurs d’impact pédologique & pratiques :')}
                </span>
                {dynamicYieldResult.pedologicalFactors.map((f, idx) => (
                  <div key={idx} className="rounded-lg bg-background/70 p-2 border border-border/70 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground">
                        {f.status === 'positive' ? '🟢' : f.status === 'penalty' ? '🔴' : '⚪'} {f.name[language] || f.name.en}
                      </span>
                      <span
                        className={`font-black font-mono shrink-0 ${
                          f.deltaPct >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {f.deltaPct >= 0 ? `+${f.deltaPct}%` : `${f.deltaPct}%`} (×{f.multiplier})
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {f.explanation[language] || f.explanation.en}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharts Comparative Visualizer */}
            <div className="mt-5 rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                  {tr(language, 'Cross-Referencing Yield Comparison (t/ha)', 'مقارنة المردود المقاطع مع المعايير (طن/هـ)', 'Comparaison des rendements croisés (t/ha)')}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {dynamicYieldResult.crop.name[language] || dynamicYieldResult.crop.name.en}
                </span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-border bg-card p-2.5 text-xs shadow-md">
                              <div className="font-bold text-foreground">{data.name}</div>
                              <div className="mt-1 font-black text-emerald-600 text-sm">{data.yieldTons} t/ha</div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                = {(data.yieldTons * 10).toFixed(1)} Qx/ha
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="yieldTons" radius={[5, 5, 0, 0]}>
                      {comparativeChartData.map((entry, index) => (
                        <Cell key={`comp-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Targeted Agronomic Action Cards from Cross-Referencing */}
            <div className="mt-5 space-y-2.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                {tr(language, 'Targeted Soil Actions for this Crop & Soil Combination:', 'إجراءات موجهة لتحسين المردود لهذا التوافق:', 'Actions ciblées pour cette combinaison sol & culture :')}
              </span>
              <div className="grid gap-2 text-xs">
                {dynamicYieldResult.targetedSoilRecommendations.map((rec, idx) => (
                  <div key={idx} className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        {rec.title[language] || rec.title.en}
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2">
                        {rec.impact}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {rec.description[language] || rec.description.en}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 1-Click Action to Apply to Field / Digital Twin */}
            <div className="mt-5">
              <Button
                type="button"
                onClick={handleApplyYield}
                className="w-full gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 sm:text-sm"
              >
                {appliedFeedback ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                    <span>{tr(language, 'Dynamic Yield Synced with Farm Digital Twin!', 'تمت مزامنة المردود الديناميكي مع التوأم الرقمي!', 'Rendement dynamique synchronisé avec le Jumeau !')}</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span>
                      {tr(
                        language,
                        `Apply ${dynamicYieldResult.dynamicYieldTonsHa} t/ha (${dynamicYieldResult.dynamicYieldQxHa} Qx) to Farm Digital Twin`,
                        `تطبيق ${dynamicYieldResult.dynamicYieldTonsHa} طن/هـ (${dynamicYieldResult.dynamicYieldQxHa} قنطار) على التوأم الرقمي`,
                        `Appliquer ${dynamicYieldResult.dynamicYieldTonsHa} t/ha (${dynamicYieldResult.dynamicYieldQxHa} Qx) au Jumeau`
                      )}
                    </span>
                  </>
                )}
              </Button>
            </div>

          </div>

          {/* Regional Reference Soils Quick Summary */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {tr(language, 'Algerian Agronomic Terroir Reference Benchmarks', 'المراجع الزراعية الإقليمية الجزائرية', 'Repères Pédologiques Algériens')}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="font-semibold text-foreground">🍇 Mitidja Tirs (Vertisols)</span>
                <span className="font-bold text-emerald-600">+15% to +25% Fruit & Cereal buffer</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="font-semibold text-foreground">🌾 High Plateaus Calcisols</span>
                <span className="font-bold text-emerald-600">+20% Durum Vitrosity / N-Fixing</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="font-semibold text-foreground">🥔 Souf / Ziban Arenosols</span>
                <span className="font-bold text-emerald-600">+50% to +60% Pivot Fertigation</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="font-semibold text-foreground">🍅 Cheliff Valley Fluvisols</span>
                <span className="font-bold text-emerald-600">+30% Alluvial Market & Tomato</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">🧂 Chott & Sebkha Solonchaks</span>
                <span className="font-bold text-rose-600">-30% to -50% Osmotic Stress Penalty</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

