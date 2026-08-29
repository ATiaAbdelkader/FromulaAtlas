'use client';

import React, { useState, useMemo } from 'react';
import {
  Waves,
  Landmark,
  ShieldAlert,
  FlaskConical,
  Activity,
  ArrowRightLeft,
  Info,
  Droplets,
  Layers,
  ThermometerSnowflake,
  Wind,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Sliders,
  Maximize2,
  Building,
  Target,
  FileSpreadsheet,
  Download,
  Share2,
  Bug,
  Satellite,
  Gauge,
  CircleDot,
  Compass,
} from 'lucide-react';
import { useLanguageStore, type Language } from '@/lib/language-store';
import {
  ALL_58_WILAYAS,
  type WilayaDataFull,
} from '@/lib/algeria-wilayas-58';
import {
  ALGERIA_AQUIFER_SYSTEMS,
  ALGERIA_STRATEGIC_CONCESSIONS,
  ALGERIA_AGRO_RISKS,
  SAMPLE_NDVI_TRENDS,
  computeSoilLabPrescription,
  type AquiferSystem,
  type ConcessionPerimeter,
} from '@/lib/algeria-advanced-gis-data';
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
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import AlgeriaPlotDrawerModal, { type DrawnPlot, type PlotShapeType } from './AlgeriaPlotDrawerModal';
import NasaHarvestCropCycleDetector from '@/components/agri/satellite/NasaHarvestCropCycleDetector';

interface AdvancedToolsModalProps {
  currentWilayaCode: number;
  onSelectWilaya: (code: number) => void;
  drawnPlots?: DrawnPlot[];
  activePlot?: DrawnPlot | null;
  onUpdateActivePlot?: (plot: DrawnPlot | null) => void;
  onSavePlot?: (plot: DrawnPlot) => void;
  onDeletePlot?: (id: string) => void;
  isDrawingMode?: boolean;
  setIsDrawingMode?: (val: boolean) => void;
}

export type ActiveAdvancedTab =
  | 'dams_network'
  | 'pivot_belts'
  | 'ccls_supply'
  | 'locust_radar'
  | 'plot_drawer'
  | 'aquifers'
  | 'concessions'
  | 'agro_risks'
  | 'lab_interpolator'
  | 'ndvi_drought'
  | 'crop_cycles'
  | 'comparator';

export default function AlgeriaAdvancedGISTools({
  currentWilayaCode,
  onSelectWilaya,
  drawnPlots = [],
  activePlot = null,
  onUpdateActivePlot = () => {},
  onSavePlot = () => {},
  onDeletePlot = () => {},
  isDrawingMode = false,
  setIsDrawingMode = () => {},
}: AdvancedToolsModalProps) {
  const { language } = useLanguageStore();
  const lang: Language = language || 'fr';

  const [activeTab, setActiveTab] = useState<ActiveAdvancedTab>('dams_network');
  const [drawingShape, setDrawingShape] = useState<PlotShapeType>('polygon');

  // Comparator Wilayas
  const [compWilayaA, setCompWilayaA] = useState<number>(currentWilayaCode);
  const [compWilayaB, setCompWilayaB] = useState<number>(currentWilayaCode === 7 ? 39 : 19);

  // Search & Filters in tools
  const [damFilter, setDamFilter] = useState<string>('all');
  const [pivotFilter, setPivotFilter] = useState<string>('all');

  // Lab Sample Inputs
  const [labInput, setLabInput] = useState({
    ph: 8.1,
    ecDsm: 3.4,
    organicMatterPct: 1.1,
    activeCaCO3Pct: 16.0,
    olsenPppm: 12.0,
    exchangeableKPpm: 140.0,
  });

  const activeWilayaObj = useMemo(() => {
    return ALL_58_WILAYAS.find((w) => w.code === currentWilayaCode) || ALL_58_WILAYAS[0];
  }, [currentWilayaCode]);

  const wilayaAObj = useMemo(() => {
    return ALL_58_WILAYAS.find((w) => w.code === compWilayaA) || ALL_58_WILAYAS[0];
  }, [compWilayaA]);

  const wilayaBObj = useMemo(() => {
    return ALL_58_WILAYAS.find((w) => w.code === compWilayaB) || ALL_58_WILAYAS[1];
  }, [compWilayaB]);

  // Compute Lab Prescription
  const labResult = useMemo(() => {
    return computeSoilLabPrescription(labInput, lang);
  }, [labInput, lang]);

  // Matched Aquifers for Current Wilaya
  const matchingAquifers = useMemo(() => {
    return ALGERIA_AQUIFER_SYSTEMS.filter((aq) => aq.coverageWilayas.includes(currentWilayaCode));
  }, [currentWilayaCode]);

  // Concessions in Current Wilaya or all
  const [concessionFilter, setConcessionFilter] = useState<'current' | 'all'>('all');
  const filteredConcessions = useMemo(() => {
    if (concessionFilter === 'current') {
      return ALGERIA_STRATEGIC_CONCESSIONS.filter((c) => c.wilayaCode === currentWilayaCode);
    }
    return ALGERIA_STRATEGIC_CONCESSIONS;
  }, [concessionFilter, currentWilayaCode]);

  // Risk profile for current wilaya
  const riskProfile = useMemo(() => {
    return (
      ALGERIA_AGRO_RISKS[currentWilayaCode] || {
        wilayaCode: currentWilayaCode,
        springFrostRisk: 'low',
        frostWindow: { en: 'Rare / Late Feb', ar: 'نادر / أواخر فيفري', fr: 'Rare / Fin Février' },
        siroccoSurgeIndex: 6.0,
        siroccoPeakMonths: { en: 'June - August', ar: 'جوان - أوت', fr: 'Juin - Août' },
        chillingHoursAvg: 450,
        recommendedEmergencyProtocol: {
          en: 'Standard irrigation adjustments and balanced foliar nutrients.',
          ar: 'تعديل برامج الري وتغذية ورقية متوازنة.',
          fr: 'Ajustement des tours d’eau et nutrition foliaire équilibrée.',
        },
      }
    );
  }, [currentWilayaCode]);

  // NDVI trend data for region
  const ndviData = useMemo(() => {
    const zoneKey =
      activeWilayaObj.zone === 'deep_sahara' || activeWilayaObj.zone === 'sahara_oasis'
        ? 'deep_sahara'
        : activeWilayaObj.zone === 'high_plateaus'
        ? 'high_plateaus'
        : 'tell_coastal';
    return SAMPLE_NDVI_TRENDS[zoneKey] || SAMPLE_NDVI_TRENDS['tell_coastal'];
  }, [activeWilayaObj]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900 space-y-6">
      {/* Header Tabs Navigation */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            🇩🇿
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              {lang === 'ar' ? 'منصة الذكاء الجغرافي الفلاحي الشامل للجزائر' : 'Plateforme d’Intelligence Agro-Spatiale & SIG Algérie'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'السدود، الرشاشات المحورية، الصوامع، مراقبة الجراد، تحاليل التربة والمياه، وحساب مساحات الحقول'
                : 'Barrages ANBT, Pivots Sahariens, Silos CCLS, Radar Acridien, Hydrogéologie & CAD Parcellaire.'}
            </p>
          </div>
        </div>

        {/* Selected Wilaya Quick Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {lang === 'ar' ? 'الولاية النشطة:' : 'Wilaya active :'}
          </span>
          <strong className="text-xs text-emerald-900 dark:text-emerald-100">
            {activeWilayaObj.codeStr} - {lang === 'ar' ? activeWilayaObj.nameAr : activeWilayaObj.nameFr}
          </strong>
        </div>
      </div>

      {/* Tabs List */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {[
          {
            id: 'dams_network',
            labelFr: '💧 Barrages & Réseaux ANBT',
            labelAr: '💧 شبكة السدود ومحيطات السقي',
            labelEn: '💧 Dams & ANBT Irrigation',
          },
          {
            id: 'pivot_belts',
            labelFr: '🌀 Pivots Céréaliers du Sud',
            labelAr: '🌀 الرشاشات المحورية بالجنوب',
            labelEn: '🌀 Southern Center-Pivots',
          },
          {
            id: 'ccls_supply',
            labelFr: '🌾 Silos CCLS & Approvisionnement',
            labelAr: '🌾 صوامع ديوان الحبوب والمدخلات',
            labelEn: '🌾 CCLS Silos & Supply Chain',
          },
          {
            id: 'locust_radar',
            labelFr: '🦗 Radar Acridien & Phyto INPV',
            labelAr: '🦗 رادار مكافحة الجراد والصحة النباتية',
            labelEn: '🦗 Locust & Phyto Radar',
          },
          {
            id: 'plot_drawer',
            labelFr: '📐 Dessinateur CAD & Parcelles',
            labelAr: '📐 حاسبة ومخطط مساحة الحقول',
            labelEn: '📐 Parcel CAD & Pivot Drawer',
          },
          {
            id: 'aquifers',
            labelFr: '🌊 Hydrogéologie & Aquifères',
            labelAr: '🌊 المياه الجوفية والألبيان',
            labelEn: '🌊 Aquifers & Deep Wells',
          },
          {
            id: 'concessions',
            labelFr: '🏛️ Grands Périmètres & ODAS',
            labelAr: '🏛️ الامتيازات والمشاريع الكبرى',
            labelEn: '🏛️ Strategic Mega-Projects',
          },
          {
            id: 'agro_risks',
            labelFr: '🛡️ Risques Sirocco & Gelées',
            labelAr: '🛡️ مخاطر الصقيع والشهيلي',
            labelEn: '🛡️ Agro-Climatic Risks',
          },
          {
            id: 'lab_interpolator',
            labelFr: '🧪 Diagnostic Laboratoire Sol',
            labelAr: '🧪 تشخيص تحاليل مخبر التربة',
            labelEn: '🧪 Soil Lab Interpolator',
          },
          {
            id: 'ndvi_drought',
            labelFr: '🛰️ Télédétection NDVI & Sécheresse',
            labelAr: '🛰️ الاستشعار عن بعد ومؤشر الجفاف',
            labelEn: '🛰️ Satellite NDVI & Drought',
          },
          {
            id: 'crop_cycles',
            labelFr: '🌾 Détecteur Cycles NASA Harvest',
            labelAr: '🌾 كاشف الدورات المحصولية ناسا',
            labelEn: '🌾 NASA Harvest Crop Cycles',
          },
          {
            id: 'comparator',
            labelFr: '⚖️ Comparateur Inter-Wilayas',
            labelAr: '⚖️ المقارنة بين الولايات',
            labelEn: '⚖️ Wilaya Benchmark',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveAdvancedTab)}
              className={`rounded-xl px-3.5 py-2 font-bold transition-all whitespace-nowrap shadow-xs ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lang === 'ar' ? tab.labelAr : lang === 'fr' ? tab.labelFr : tab.labelEn}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DAMS & IRRIGATION NETWORK TAB                                          */}
      {/* ========================================================================= */}
      {activeTab === 'dams_network' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-sky-50 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-sky-900 dark:text-sky-200 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-600" />
                {lang === 'ar' ? 'منظومة السدود الكبرى ومحيطات السقي الفلاحي (الوكالة الوطنية للسدود ANBT)' : 'Grands Barrages & Réseau des Périmètres d’Irrigation (ANBT)'}
              </h3>
              <p className="text-xs text-sky-800 dark:text-sky-300">
                {lang === 'ar'
                  ? 'متابعة السعة التخزينية (مليون م³)، نسب الامتلاء الحالية، والمحيطات الفلاحية المرتبطة بكل سد'
                  : 'Capacité totale, taux de remplissage actuels, bassins versants et grands périmètres agricoles desservis.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
                Total Réserve Cartographiée :
              </span>
              <strong className="text-sm font-mono text-sky-700 dark:text-sky-300">
                3,225 Million m³
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALGERIA_MAJOR_DAMS.map((dam) => {
              const isNearby = dam.wilayaCode === currentWilayaCode;
              return (
                <div
                  key={dam.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isNearby
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        {dam.wilayaName} ({dam.basin})
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {dam.yearCommissioned}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {dam.name[lang] || dam.name.fr}
                    </h4>

                    {/* Fill Rate Gauge */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">Taux de Remplissage:</span>
                        <strong className="text-sky-600 dark:text-sky-400">{dam.currentFillRatePct}%</strong>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${dam.currentFillRatePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">Capacité Retenue :</span>{' '}
                        <strong>{dam.capacityMillionM3} Hm³ (Million m³)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Superficie Irrigable :</span>{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">{dam.servedAreaHa.toLocaleString()} Hectares</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                        🌾 {dam.irrigationPerimeter[lang] || dam.irrigationPerimeter.fr}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <button
                      onClick={() => onSelectWilaya(dam.wilayaCode)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                    >
                      <span>{lang === 'ar' ? 'عرض الولاية على الخريطة' : 'Localiser Wilaya'}</span>
                      <span>→</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      GPS: {dam.geoCoords.lat.toFixed(2)}, {dam.geoCoords.lng.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SOUTHERN CENTER-PIVOTS TAB                                             */}
      {/* ========================================================================= */}
      {activeTab === 'pivot_belts' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-amber-600" />
                {lang === 'ar' ? 'محيطات الرشاشات المحورية بالجنوب الجزائري (أكثر من 13,700 رشاش)' : 'Ceintures & Méga-Pôles de Pivots Céréaliers du Sud Algérien (> 13 700 Pivots)'}
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {lang === 'ar'
                  ? 'تفاصيل المشاريع الكبرى لإنتاج القمح الصلب، الذرة العلفية، البرسيم، وأعماق الآبار ومصادر المياه الجوفية'
                  : 'Pôles stratégiques de céréaliculture intensive sous pivots géants, profondeurs de forages et qualité de l’eau.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Total Superficie Pivots :
              </span>
              <strong className="text-sm font-mono text-amber-700 dark:text-amber-300">
                438,000 Hectares
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALGERIA_PIVOT_CLUSTERS.map((cluster) => {
              const isSelected = cluster.wilayaCode === currentWilayaCode;
              return (
                <div
                  key={cluster.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {cluster.wilayaName} ({cluster.irrigationMethod})
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {cluster.totalPivotsCount.toLocaleString()} Pivots
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {cluster.name[lang] || cluster.name.fr}
                    </h4>

                    <div className="pt-2 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">Superficie Sous Pivots :</span>{' '}
                        <strong>{cluster.totalAreaHa.toLocaleString()} ha</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Source Aquifère :</span>{' '}
                        <strong className="text-sky-600 dark:text-sky-400">{cluster.aquiferSource}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Profondeur Forage: <strong>{cluster.averageWellDepthM} m</strong></span>
                        <span>Salinité ECw: <strong className="text-amber-600">{cluster.salinityECw} dS/m</strong></span>
                      </div>

                      {/* Primary Crops List */}
                      <div className="pt-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">Cultures Dominantes:</span>
                        <div className="flex flex-wrap gap-1">
                          {cluster.primaryCrops.map((c, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300">
                              🌱 {c[lang] || c.fr}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <button
                      onClick={() => onSelectWilaya(cluster.wilayaCode)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                    >
                      <span>{lang === 'ar' ? 'عرض على الخريطة' : 'Inspecter sur Carte'}</span>
                      <span>→</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      Diamètre: {cluster.pivotDiameterMeters}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CCLS SILOS & SUPPLY CHAIN TAB                                          */}
      {/* ========================================================================= */}
      {activeTab === 'ccls_supply' && (
        <div className="space-y-6">
          {/* Silos Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-600" />
                {lang === 'ar' ? 'صوامع ديوان الحبوب (CCLS) وشبكة التخزين الاستراتيجي' : 'Silos Géants CCLS & Stockage Stratégique des Grains'}
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-600">
                Capacité Réseau : ~870,000 Tonnes
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ALGERIA_CCLS_SILOS.map((silo) => (
                <div
                  key={silo.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {silo.wilayaName}
                    </span>
                    {silo.railConnected && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-300">
                        🚆 Raccordé Rail SNTF
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {silo.name[lang] || silo.name.fr}
                  </h4>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400">Capacité de Stockage:</span>{' '}
                      <strong className="text-emerald-600">{silo.storageCapacityTons.toLocaleString()} Tonnes</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Grains Collectés:</span>{' '}
                      <span>{silo.grainTypes.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fertilizer Plants & Soil Labs */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-purple-600" />
              {lang === 'ar' ? 'مجمعات صناعة الأسمدة (أسمدال / فرتيال) ومخابر تحليل التربة' : 'Complexes d’Engrais (ASMIDAL/FERTIAL) & Laboratoires d’Analyses'}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ALGERIA_SUPPLY_HUBS.map((hub) => (
                <div
                  key={hub.id}
                  className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 dark:border-purple-900/40 dark:bg-purple-950/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                      {hub.operator}
                    </span>
                    <span className="text-xs font-mono text-purple-700 dark:text-purple-300 font-bold">
                      {hub.type === 'fertilizer_plant' ? '🏭 Usine de Synthèse' : '🔬 Laboratoire Agronomique'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {hub.name[lang] || hub.name.fr}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {hub.services[lang] || hub.services.fr}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LOCUST & PHYTO SURVEILLANCE RADAR TAB                                  */}
      {/* ========================================================================= */}
      {activeTab === 'locust_radar' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <Bug className="h-4 w-4 text-rose-600" />
                {lang === 'ar' ? 'رادار مراقبة الجراد الصحراوي وممرات التسلل الجنوبية (INPV / FAO)' : 'Radar & Réseau de Surveillance Acridienne Saharienne (INPV / FAO)'}
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300">
                {lang === 'ar'
                  ? 'رصد محاور هجرة الجراد الصحراوي من منطقة الساحل الإفريقي ومحطات الرصد الميداني والمعاملات الحيوية'
                  : 'Corridors migratoires transfrontaliers du Criquet Pèlerin, verdissement des lits d’oueds et lutte biologique.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Statut National : CALME
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ALGERIA_LOCUST_ZONES.map((zone) => (
              <div
                key={zone.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
                style={{ borderLeftWidth: 4, borderLeftColor: zone.color }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                      style={{ backgroundColor: zone.color }}
                    >
                      Alerte : {zone.riskLevel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      GPS: {zone.geoCoords.lat.toFixed(2)}, {zone.geoCoords.lng.toFixed(2)}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {zone.name[lang] || zone.name.fr}
                  </h4>

                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400">Trajectoire / Origine :</span>{' '}
                      <strong>{zone.trajectoryFrom}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 text-[11px] dark:bg-slate-800/60">
                      <span className="text-slate-400 block mb-0.5">Végétation & Lits d’Oueds:</span>
                      <span>{zone.pastureGreeningStatus[lang] || zone.pastureGreeningStatus.fr}</span>
                    </div>
                    <div className="rounded-xl bg-emerald-50/70 p-2 text-[11px] dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                      <span className="font-bold block mb-0.5">Biocontrôle Préconisé:</span>
                      <span>{zone.recommendedBiocontrol[lang] || zone.recommendedBiocontrol.fr}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PARCEL CAD & PIVOT DRAWER TAB                                          */}
      {/* ========================================================================= */}
      {activeTab === 'plot_drawer' && (
        <AlgeriaPlotDrawerModal
          drawnPlots={drawnPlots}
          activePlot={activePlot}
          onUpdateActivePlot={onUpdateActivePlot}
          onSavePlot={onSavePlot}
          onDeletePlot={onDeletePlot}
          isDrawingMode={isDrawingMode}
          setIsDrawingMode={setIsDrawingMode}
          drawingShape={drawingShape}
          setDrawingShape={setDrawingShape}
          currentWilayaCode={currentWilayaCode}
          onSelectWilaya={onSelectWilaya}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. AQUIFERS & HYDROGEOLOGY TAB                                            */}
      {/* ========================================================================= */}
      {activeTab === 'aquifers' && (
        <div className="space-y-6">
          {/* Top Banner / Current Wilaya Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-50 p-4 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-sky-900 dark:text-sky-200">
                  {lang === 'ar' ? 'المنظومة المائية الجوفية للولاية' : 'Hydrogéologie & Nappes Phréatiques'}
                </h3>
              </div>
              <p className="text-xs text-sky-700 dark:text-sky-300">
                {lang === 'ar'
                  ? `الطبقات المائية العميقة والسطحية المغذية لولاية ${activeWilayaObj.nameAr} وتكلفة الضخ`
                  : `Nappes profondes et alluviales traversant la wilaya de ${activeWilayaObj.nameFr}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                {lang === 'ar' ? 'النطاق المائي السائد:' : 'Régime hydrique :'}
              </span>
              <span className="rounded-lg bg-sky-200 px-2.5 py-1 text-xs font-bold text-sky-900 dark:bg-sky-900 dark:text-sky-200">
                {activeWilayaObj.damOrBasinFr}
              </span>
            </div>
          </div>

          {/* Aquifers Cards Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ALGERIA_AQUIFER_SYSTEMS.map((aq) => {
              const isCovered = aq.coverageWilayas.includes(currentWilayaCode);
              return (
                <div
                  key={aq.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4.5 transition-all ${
                    isCovered
                      ? 'border-sky-500 bg-sky-50/30 dark:bg-sky-950/20 shadow-md ring-2 ring-sky-500/20'
                      : 'border-slate-200 bg-white opacity-85 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold font-mono ${
                          aq.type === 'deep_fossil'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {aq.code}
                      </span>
                      {isCovered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {lang === 'ar' ? 'تغطي الولاية الحالية' : 'Alimente cette wilaya'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">
                          {aq.coverageWilayas.length} wilayas
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                      {aq.name[lang] || aq.name.fr}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {aq.description[lang] || aq.description.fr}
                    </p>

                    {/* Numeric Indicators */}
                    <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'العمق (متر)' : 'Profondeur'}</span>
                        <strong className="text-xs text-slate-800 dark:text-slate-100">
                          {aq.depthRangeMeters[0]} – {aq.depthRangeMeters[1]} m
                        </strong>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'الملوحة (ECw)' : 'Salinité ECw'}</span>
                        <strong className="text-xs text-amber-600 dark:text-amber-400">
                          {aq.waterECwDsm} dS/m
                        </strong>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'تكلفة الضخ' : 'Coût Pomp.'}</span>
                        <strong className="text-xs text-emerald-600 dark:text-emerald-400">
                          {aq.pumpingCostDzdM3} DA / m³
                        </strong>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'تكلفة الحفر/م' : 'Forage / m'}</span>
                        <strong className="text-xs text-slate-800 dark:text-slate-100">
                          {aq.drillingCostPerMeterDzd.toLocaleString()} DA
                        </strong>
                      </div>
                    </div>

                    {/* Recommendation Box */}
                    <div className="rounded-xl bg-emerald-50/70 p-2.5 text-xs text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-800/40">
                      <span className="font-bold">{lang === 'ar' ? '💡 التوصية الزراعية للمياه:' : '💡 Conseil Agronomique :'}</span>{' '}
                      {aq.agriRecommendation[lang] || aq.agriRecommendation.fr}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. STRATEGIC CONCESSIONS TAB                                              */}
      {/* ========================================================================= */}
      {activeTab === 'concessions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {lang === 'ar' ? 'الامتيازات الزراعية والمحيطات الإستراتيجية (ODAS / ONTA)' : 'Grands Périmètres Stratégiques & Concessions ODAS'}
              </h3>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setConcessionFilter('all')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  concessionFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? 'كل المحيطات الوطنية' : 'Toutes les concessions'}
              </button>
              <button
                onClick={() => setConcessionFilter('current')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  concessionFilter === 'current'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {lang === 'ar' ? `المحيطات في ${activeWilayaObj.nameAr}` : `Dans ${activeWilayaObj.nameFr}`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredConcessions.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {c.wilayaName[lang] || c.wilayaName.fr} • {c.allocatedAreaHa.toLocaleString()} ha
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {c.agencyType === 'GIPLAIT_BALADNA' ? '🤝 Partenariat International' : '🇩🇿 Portefeuille National'}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {c.name[lang] || c.name.fr}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {c.description[lang] || c.description.fr}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'المحاصيل المستهدفة' : 'Cultures phares'}</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {c.strategicPillar === 'cereal_pivot'
                          ? 'Blé dur • Céréales'
                          : c.strategicPillar === 'dairy_mega_farm'
                          ? 'Luzerne • Maïs fourrage'
                          : c.strategicPillar === 'sugar_beet'
                          ? 'Betterave sucrière'
                          : c.strategicPillar === 'date_export'
                          ? 'Palmier dattier'
                          : c.strategicPillar === 'arboriculture'
                          ? 'Arboriculture'
                          : 'Colza • Oléoprotéagineux'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'نظام الري المعتمد' : 'Mode d’irrigation'}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {lang === 'ar' ? `محور دوار ×${c.pivotCountEstimate}` : `Pivot × ${c.pivotCountEstimate}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => onSelectWilaya(c.wilayaCode)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                  >
                    <span>{lang === 'ar' ? 'التركيز على الولاية' : 'Voir sur la carte'}</span>
                    <span>→</span>
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">
                    {c.agencyType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. AGRO-CLIMATIC RISKS TAB                                                */}
      {/* ========================================================================= */}
      {activeTab === 'agro_risks' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {lang === 'ar' ? `مخاطر المناخ الزراعي لولاية ${activeWilayaObj.nameAr}` : `Matrice des Risques Climatiques - ${activeWilayaObj.nameFr}`}
                </h3>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {lang === 'ar'
                  ? 'مؤشرات الصقيع الربيعي، شدة رياح الشهيلي/السيروكو، وساعات البرودة اللازمة للأشجار المثمرة'
                  : 'Gel printanier, indice de vulnérabilité au Sirocco et cumul d’heures de froid (< 7.2°C).'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Frost Risk */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'الصقيع الربيعي المتأخر' : 'Gel Tardif Printanier'}
                </span>
                <ThermometerSnowflake className="h-4 w-4 text-sky-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-lg font-extrabold capitalize ${
                    riskProfile.springFrostRisk === 'critical'
                      ? 'text-rose-600'
                      : riskProfile.springFrostRisk === 'moderate'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {riskProfile.springFrostRisk}
                </span>
                <span className="text-xs text-slate-400">
                  ({riskProfile.frostWindow[lang] || riskProfile.frostWindow.fr})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'حساسية عالية لأشجار اللوز، المشمش، والكروم أثناء الإزهار'
                  : 'Sensibilité critique au débourrement pour amandiers, abricotiers et vignes.'}
              </p>
            </div>

            {/* Sirocco / Heat Surge */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'مؤشر رياح الشهيلي (Sirocco)' : 'Indice de Risque Sirocco'}
                </span>
                <Wind className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-amber-600">
                  {riskProfile.siroccoSurgeIndex} / 10
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  ({riskProfile.siroccoPeakMonths[lang] || riskProfile.siroccoPeakMonths.fr})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'يسبب ظاهرة الشياط (Échaudage) للقمح وجفاف أوراق الحمضيات'
                  : 'Risque majeur d’échaudage thermique des grains de céréales et chute de nouaison.'}
              </p>
            </div>

            {/* Chilling Hours */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'ساعات البرودة الشتوية (<7.2°م)' : 'Heures de Froid Hivernal'}
                </span>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-emerald-600">
                  {riskProfile.chillingHoursAvg} h
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  (Modèle Weinberg)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'ضروري لكسر سكون براعم التفاح، الخوخ، الفستق والجوز'
                  : 'Levée de dormance indispensable pour pommiers, pêchers, noyers et pistachiers.'}
              </p>
            </div>
          </div>

          {/* Emergency Protocol Action Plan */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              {lang === 'ar' ? 'البروتوكول الوقائي والعلاجي الموصى به محلياً:' : 'Protocole d’Urgence & Résilience Agronomique :'}
            </h4>
            <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
              {riskProfile.recommendedEmergencyProtocol[lang] ||
                riskProfile.recommendedEmergencyProtocol.fr}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. LAB INTERPOLATOR TAB                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'lab_interpolator' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-emerald-600" />
                {lang === 'ar' ? 'محاكي تفسير نتائج تحاليل التربة ووصفات الأسمدة الوطنية' : 'Interprétateur d’Analyses de Sol & Prescriptions Nationales'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'أدخل نتائج مخبر التربة لحساب التوصيات بأسمدة TSP، اليوريا، سلفات البوتاس، والجبس الزراعي'
                  : 'Calculez instantanément les doses d’amendements (TSP 46%, Urée 46%, SOP 50%, Gypse) selon la norme algérienne.'}
              </p>
            </div>
          </div>

          {/* Inputs Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">pH (Eau 1:2.5)</label>
              <input
                type="number"
                step="0.1"
                value={labInput.ph}
                onChange={(e) => setLabInput({ ...labInput, ph: parseFloat(e.target.value) || 7 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">EC (dS/m)</label>
              <input
                type="number"
                step="0.1"
                value={labInput.ecDsm}
                onChange={(e) => setLabInput({ ...labInput, ecDsm: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Mat. Organique (%)</label>
              <input
                type="number"
                step="0.1"
                value={labInput.organicMatterPct}
                onChange={(e) => setLabInput({ ...labInput, organicMatterPct: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Calcaire Actif (%)</label>
              <input
                type="number"
                step="0.5"
                value={labInput.activeCaCO3Pct}
                onChange={(e) => setLabInput({ ...labInput, activeCaCO3Pct: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">P Olsen (ppm)</label>
              <input
                type="number"
                step="1"
                value={labInput.olsenPppm}
                onChange={(e) => setLabInput({ ...labInput, olsenPppm: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">K Échangeable (ppm)</label>
              <input
                type="number"
                step="5"
                value={labInput.exchangeableKPpm}
                onChange={(e) => setLabInput({ ...labInput, exchangeableKPpm: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Results Output */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Prescriptions */}
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 lg:col-span-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'وصفة التسميد الكيميائي الموصى بها (كغ/هكتار):' : 'Prescription Minérale Recommandée (kg / ha) :'}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white p-3 text-center shadow-xs dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block">Urée 46% N</span>
                  <span className="text-lg font-extrabold text-emerald-600">
                    {labResult.nPrescriptionKgHaUrea} kg/ha
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-xs dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block">TSP 46% P₂O₅</span>
                  <span className="text-lg font-extrabold text-sky-600">
                    {labResult.pPrescriptionKgHaTSP} kg/ha
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-xs dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block">SOP 50% K₂O</span>
                  <span className="text-lg font-extrabold text-purple-600">
                    {labResult.kPrescriptionKgHaSOP} kg/ha
                  </span>
                </div>
              </div>
            </div>

            {/* Soil Amendments */}
            <div className="space-y-2 rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 lg:col-span-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                {lang === 'ar' ? 'المحسنات والتدخلات الفيزيوكيميائية للتربة:' : 'Amendements & Corrections Physico-Chimiques :'}
              </h4>
              <div className="space-y-2">
                {labResult.recommendedSoilAmenders.map((am, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-white/80 p-2.5 text-xs dark:bg-slate-900/80">
                    <div>
                      <strong className="text-emerald-900 dark:text-emerald-100">{am.productName}</strong>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">{am.reason}</span>
                    </div>
                    <span className="rounded-lg bg-emerald-100 px-2 py-1 font-mono font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {am.dosage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. NDVI & DROUGHT SATELLITE TAB                                          */}
      {/* ========================================================================= */}
      {activeTab === 'ndvi_drought' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 p-4 text-white">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'ar' ? `المؤشر النباتي الفضائي (Sentinel-2 NDVI) - إقليم ${activeWilayaObj.nameAr}` : `Télédétection Sentinel-2 NDVI & Indice SPI - ${activeWilayaObj.nameFr}`}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? 'مقارنة الغطاء النباتي خلال الموسم الفلاحي مع المتوسط المرجعي لعشر سنوات'
                  : 'Suivi de la vigueur chlorophyllienne et détection précoce du stress hydrique.'}
              </p>
            </div>
          </div>

          {/* Recharts NDVI Line Chart */}
          <div className="h-[280px] w-full rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ndviData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 0.9]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="ndvi_current"
                  name={lang === 'ar' ? 'الموسم الحالي (Sentinel-2)' : 'Saison Actuelle (2025/2026)'}
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="ndvi_10yr_avg"
                  name={lang === 'ar' ? 'المتوسط التاريخي (10 سنوات)' : 'Moyenne Historique (10 ans)'}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. NASA HARVEST CROP CYCLE DETECTION TAB                                 */}
      {/* ========================================================================= */}
      {activeTab === 'crop_cycles' && (
        <div className="space-y-4">
          <NasaHarvestCropCycleDetector />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. WILAYAS COMPARATOR TAB                                                */}
      {/* ========================================================================= */}
      {activeTab === 'comparator' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {lang === 'ar' ? 'مقارنة فلاحية وهيدرولوجية بين ولايتين' : 'Comparateur Agronomique & Hydrique Bipolaire'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ar'
                    ? 'قارن بين نوع التربة، كميات الأمطار، الملوحة، وساعات البرودة'
                    : 'Comparez le potentiel des sols, la pluviométrie et les filières agricoles.'}
                </p>
              </div>
            </div>

            {/* Selectors */}
            <div className="flex items-center gap-3">
              <select
                value={compWilayaA}
                onChange={(e) => setCompWilayaA(parseInt(e.target.value))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {ALL_58_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.codeStr} - {w.nameFr}
                  </option>
                ))}
              </select>

              <span className="text-xs font-bold text-slate-400">VS</span>

              <select
                value={compWilayaB}
                onChange={(e) => setCompWilayaB(parseInt(e.target.value))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {ALL_58_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.codeStr} - {w.nameFr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                <tr>
                  <th className="p-3.5 font-bold">{lang === 'ar' ? 'المعيار الزراعي' : 'Critère Agronomique'}</th>
                  <th className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                    {wilayaAObj.codeStr} - {wilayaAObj.nameFr}
                  </th>
                  <th className="p-3.5 font-bold text-sky-700 dark:text-sky-400">
                    {wilayaBObj.codeStr} - {wilayaBObj.nameFr}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                <tr>
                  <td className="p-3 font-semibold text-slate-500">{lang === 'ar' ? 'التربة السائدة' : 'Type de Sol Dominant'}</td>
                  <td className="p-3 font-bold">{wilayaAObj.soilNameFr}</td>
                  <td className="p-3 font-bold">{wilayaBObj.soilNameFr}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">{lang === 'ar' ? 'الأمطار السنوية' : 'Pluviométrie Annuelle'}</td>
                  <td className="p-3 font-bold text-emerald-600">{wilayaAObj.rainfallMm} mm/an</td>
                  <td className="p-3 font-bold text-sky-600">{wilayaBObj.rainfallMm} mm/an</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">{lang === 'ar' ? 'المناخ الحيوي' : 'Bioclimat'}</td>
                  <td className="p-3 capitalize">{wilayaAObj.bioclimate.replace('_', ' ')}</td>
                  <td className="p-3 capitalize">{wilayaBObj.bioclimate.replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">{lang === 'ar' ? 'الحوض أو السد' : 'Bassin / Barrage'}</td>
                  <td className="p-3">{wilayaAObj.damOrBasinFr}</td>
                  <td className="p-3">{wilayaBObj.damOrBasinFr}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">{lang === 'ar' ? 'المحاصيل الرئيسية' : 'Spécialités Phares'}</td>
                  <td className="p-3 text-emerald-700 dark:text-emerald-300">{wilayaAObj.keyProduceFr}</td>
                  <td className="p-3 text-sky-700 dark:text-sky-300">{wilayaBObj.keyProduceFr}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
