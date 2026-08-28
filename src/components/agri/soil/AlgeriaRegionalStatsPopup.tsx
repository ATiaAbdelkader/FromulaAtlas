'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Mountain,
  Sprout,
  Droplets,
  CloudRain,
  Sun,
  Thermometer,
  Wind,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Copy,
  ChevronRight,
  Compass,
  Building,
  Info,
  Calendar,
  Share2,
  Check,
} from 'lucide-react';
import { useLanguageStore, type Language } from '@/lib/language-store';
import {
  ALGERIA_AGRO_ZONES_CONFIG,
  SOIL_CLASSES_INFO,
  type AlgeriaAgroZone,
  type AlgeriaSoilClass,
} from '@/lib/algeria-map-data';
import { ALL_58_WILAYAS, type WilayaDataFull } from '@/lib/algeria-wilayas-58';
import { type ForecastCurrent, type DailyForecast } from '@/lib/open-meteo';

interface AlgeriaRegionalStatsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  wilaya: WilayaDataFull | null;
  zone: AlgeriaAgroZone | null;
  onSelectWilaya: (code: number) => void;
  weatherData?: {
    current: ForecastCurrent | null;
    daily: DailyForecast[];
    loading: boolean;
    error: string | null;
  };
}

type PopupTab = 'overview' | 'soil' | 'climate' | 'crops' | 'zone_context';

export default function AlgeriaRegionalStatsPopup({
  isOpen,
  onClose,
  wilaya,
  zone,
  onSelectWilaya,
  weatherData,
}: AlgeriaRegionalStatsPopupProps) {
  const { language } = useLanguageStore();
  const lang: Language = language || 'fr';

  const [activeTab, setActiveTab] = useState<PopupTab>('overview');
  const [copied, setCopied] = useState<boolean>(false);

  // Active wilaya fallback if none passed but zone passed
  const activeWilaya = useMemo(() => {
    if (wilaya) return wilaya;
    if (zone) {
      return ALL_58_WILAYAS.find((w) => w.zone === zone) || ALL_58_WILAYAS[0];
    }
    return ALL_58_WILAYAS[6]; // Biskra
  }, [wilaya, zone]);

  const activeZoneKey: AlgeriaAgroZone = activeWilaya?.zone || zone || 'tell_coastal';
  const zoneConfig = ALGERIA_AGRO_ZONES_CONFIG[activeZoneKey];
  const soilInfo = SOIL_CLASSES_INFO[activeWilaya.dominantSoil] || SOIL_CLASSES_INFO['calcisol'];

  // All wilayas belonging to this zone
  const companionWilayasInZone = useMemo(() => {
    return ALL_58_WILAYAS.filter((w) => w.zone === activeZoneKey);
  }, [activeZoneKey]);

  if (!isOpen) return null;

  const handleCopyStats = () => {
    if (!activeWilaya) return;
    const statsText = `[SIG-AGRI DZ] Wilaya ${activeWilaya.codeStr} - ${activeWilaya.nameFr} (${activeWilaya.nameAr})
• Zone: ${zoneConfig?.name.fr || activeZoneKey}
• Type de Sol: ${activeWilaya.soilNameFr} (${soilInfo.texture})
• pH: ${activeWilaya.ph} | M.O: ${activeWilaya.omPct}% | Calcaire Actif: ${activeWilaya.limePct}%
• Pluviométrie: ${activeWilaya.rainfallMm} mm/an | Bioclimat: ${activeWilaya.bioclimate}
• Salinité (ECe): ${activeWilaya.salinityEC} dS/m (Risque: ${activeWilaya.salinityRisk})
• Vocation: ${activeWilaya.keyProduceFr}
• Hydraulique: ${activeWilaya.damOrBasinFr} / ${activeWilaya.waterSourceFr}`;

    navigator.clipboard.writeText(statsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Zone & Wilaya Gradient */}
        <div
          className="relative overflow-hidden p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${zoneConfig?.color || '#059669'} 0%, #0f172a 100%)`,
          }}
        >
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 font-mono text-sm font-extrabold text-white backdrop-blur-md">
                  {activeWilaya.codeStr}
                </span>
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  {zoneConfig?.name[lang] || zoneConfig?.name.fr}
                </span>
                <span className="rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 border border-emerald-400/30">
                  {activeWilaya.bioclimate.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {activeWilaya.nameFr}
                </h2>
                <h3 className="text-xl font-bold text-slate-200 sm:text-2xl" dir="rtl">
                  {activeWilaya.nameAr}
                </h3>
              </div>

              <p className="text-xs text-slate-200/90 sm:text-sm max-w-xl">
                {lang === 'ar'
                  ? `عاصمة الولاية: ${activeWilaya.capitalAr} • التموقع: خط عرض ${activeWilaya.lat.toFixed(2)}°، خط طول ${activeWilaya.lng.toFixed(2)}°`
                  : `Chef-lieu : ${activeWilaya.capitalFr} • Coordonnées : ${activeWilaya.lat.toFixed(2)}°N, ${activeWilaya.lng.toFixed(2)}°E`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyStats}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/25 border border-white/20"
                title="Copier les statistiques"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? (lang === 'ar' ? 'تم النسخ' : 'Copié !') : (lang === 'ar' ? 'نسخ الإحصائيات' : 'Copier')}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 backdrop-blur-md"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Wilaya Jump Selector Bar inside Header */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-white/15 text-xs">
            <span className="text-white/80 font-medium">
              {lang === 'ar' ? 'تغيير الولاية:' : 'Changer de Wilaya :'}
            </span>
            <select
              value={activeWilaya.code}
              onChange={(e) => onSelectWilaya(Number(e.target.value))}
              className="rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {ALL_58_WILAYAS.map((w) => (
                <option key={w.code} value={w.code} className="bg-slate-900 text-white">
                  {w.codeStr} - {w.nameFr} ({w.nameAr})
                </option>
              ))}
            </select>

            <span className="ml-auto text-[11px] text-white/70">
              {companionWilayasInZone.length} {lang === 'ar' ? 'ولاية في هذا الإقليم' : 'wilayas dans cette zone'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-950">
          {[
            { id: 'overview', labelFr: 'Vue d’Ensemble', labelAr: 'نظرة شاملة', icon: Layers },
            { id: 'soil', labelFr: 'Pédologie & Sols', labelAr: 'التربة وخصائصها', icon: Sprout },
            { id: 'climate', labelFr: 'Climat & Eau', labelAr: 'المناخ ومصادر الري', icon: CloudRain },
            { id: 'crops', labelFr: 'Cultures & Vocation', labelAr: 'المحاصيل والإنتاج', icon: Sparkles },
            { id: 'zone_context', labelFr: 'Contexte Régional', labelAr: 'الإقليم الفلاحي', icon: Mountain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as PopupTab)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{lang === 'ar' ? tab.labelAr : tab.labelFr}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Key Highlight Metric Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Sprout className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{lang === 'ar' ? 'التربة السائدة' : 'Type de Sol'}</span>
                  </div>
                  <strong className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    {activeWilaya.soilNameFr}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    {soilInfo.texture}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <CloudRain className="h-3.5 w-3.5 text-sky-500" />
                    <span>{lang === 'ar' ? 'الأمطار السنوية' : 'Pluviométrie'}</span>
                  </div>
                  <strong className="mt-1 block text-sm font-extrabold text-sky-600 dark:text-sky-400">
                    {activeWilaya.rainfallMm} mm/an
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block capitalize">
                    {activeWilaya.bioclimate.replace('_', ' ')}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                    <span>{lang === 'ar' ? 'درجة الحموضة pH' : 'pH du Sol'}</span>
                  </div>
                  <strong className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    pH {activeWilaya.ph}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {activeWilaya.ph > 7.5
                      ? lang === 'ar' ? 'قاعدي جيري' : 'Alcalin calcaire'
                      : activeWilaya.ph < 6.5
                      ? lang === 'ar' ? 'حمضي' : 'Acide'
                      : lang === 'ar' ? 'متعادل مثالي' : 'Neutre optimal'}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Droplets className="h-3.5 w-3.5 text-teal-500" />
                    <span>{lang === 'ar' ? 'الملوحة والمخاطر' : 'Salinité & Risque'}</span>
                  </div>
                  <strong className="mt-1 block text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {activeWilaya.salinityEC} dS/m
                  </strong>
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      activeWilaya.salinityRisk === 'high' || activeWilaya.salinityRisk === 'severe'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : activeWilaya.salinityRisk === 'moderate'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {activeWilaya.salinityRisk}
                  </span>
                </div>
              </div>

              {/* Main Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'الإنتاج الفلاحي الرئيسي والمحاصيل' : 'Vocation Agricole & Filières Clés'}
                  </h4>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'ar' ? activeWilaya.keyProduceAr : activeWilaya.keyProduceFr}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'التوجيهات والخصوصيات الزراعية' : 'Spécificités & Recommandations Agronomiques'}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? activeWilaya.agronomicHighlightAr : activeWilaya.agronomicHighlightFr}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'الموارد المائية والسقي' : 'Ressources Hydrauliques & Origine de l’Eau'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    💧 <strong>{activeWilaya.damOrBasinFr}</strong> — {lang === 'ar' ? activeWilaya.waterSourceAr : activeWilaya.waterSourceFr}
                  </p>
                </div>
              </div>

              {/* Live Satellite Weather Snapshot if available */}
              {weatherData?.current && (
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'ar' ? 'الطقس الفضائي المباشر (Open-Meteo)' : 'Météo Satellitaire en Direct'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {activeWilaya.lat.toFixed(2)}°N, {activeWilaya.lng.toFixed(2)}°E
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-white">
                        {Math.round(weatherData.current.temperature)}°C
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        ({lang === 'ar' ? 'المحسوسة:' : 'Ressentie :'} {Math.round(weatherData.current.apparentTemperature)}°C)
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-300">
                      <span>💧 Humidité: <strong>{weatherData.current.relativeHumidity}%</strong></span>
                      <span>💨 Vent: <strong>{weatherData.current.windSpeed10m} km/h</strong></span>
                      <span>🌧️ Pluie: <strong>{weatherData.current.precipitation} mm</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SOIL & PEDOLOGY */}
          {activeTab === 'soil' && (
            <div className="space-y-6">
              {/* Soil Overview Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {lang === 'ar' ? 'التصنيف البيدولوجي للتربة' : 'Classification Pédologique FAO / INRAA'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {soilInfo.name[lang] || soilInfo.name.fr}
                    </h3>
                  </div>
                  <span
                    className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: soilInfo.color }}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {soilInfo.description[lang] || soilInfo.description.fr}
                </p>
              </div>

              {/* Detailed Physical & Chemical Soil Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {lang === 'ar' ? 'القوام والتركيب' : 'Texture Granulométrique'}
                  </span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100 block mt-0.5">
                    {lang === 'ar' ? activeWilaya.textureAr : activeWilaya.textureFr}
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {lang === 'ar' ? 'درجة الحموضة pH' : 'Potentiel Hydrogène (pH)'}
                  </span>
                  <strong className="text-sm text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {activeWilaya.ph}
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {lang === 'ar' ? 'المادة العضوية (M.O)' : 'Matière Organique (M.O)'}
                  </span>
                  <strong className="text-sm text-amber-600 dark:text-amber-400 block mt-0.5">
                    {activeWilaya.omPct}%
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {lang === 'ar' ? 'الكلس الفعال (CaCO3)' : 'Calcaire Actif (CaCO3)'}
                  </span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100 block mt-0.5">
                    {activeWilaya.limePct}%
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {lang === 'ar' ? 'الناقلية الكهربائية (ECe)' : 'Salinité / Conductivité (ECe)'}
                  </span>
                  <strong className="text-sm text-sky-600 dark:text-sky-400 block mt-0.5">
                    {activeWilaya.salinityEC} dS/m
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {lang === 'ar' ? 'سعة الاحتفاظ المائي' : 'Réserve Utile en Eau (RU)'}
                  </span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100 block mt-0.5">
                    {activeWilaya.whcMm} mm/m
                  </strong>
                </div>
              </div>

              {/* Challenge & Recommendations */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>{lang === 'ar' ? 'التحدي الرئيسي للتربة' : 'Contrainte Pédologique Majeure'}</span>
                  </div>
                  <p className="mt-2 text-xs text-rose-900 dark:text-rose-200">
                    {soilInfo.keyChallenge[lang] || soilInfo.keyChallenge.fr}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'المحسنات والأسمدة الموصى بها' : 'Amendements & Engrais Recommandés'}</span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-900 dark:text-emerald-200">
                    {soilInfo.recommendedAmendments[lang] || soilInfo.recommendedAmendments.fr}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLIMATE & WATER */}
          {activeTab === 'climate' && (
            <div className="space-y-6">
              {/* Climate Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-sky-50 p-4 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                    {lang === 'ar' ? 'الأمطار السنوية' : 'Pluie Annuelle'}
                  </span>
                  <span className="text-xl font-black text-sky-900 dark:text-sky-100 block mt-1">
                    {activeWilaya.rainfallMm} mm
                  </span>
                  <span className="text-[10px] text-sky-700 dark:text-sky-300">
                    Moyenne historique
                  </span>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    {lang === 'ar' ? 'حرارة الصيف / الشتاء' : 'Températures T°'}
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-amber-100 block mt-1">
                    {activeWilaya.tempSummer}°C / {activeWilaya.tempWinter}°C
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300">
                    Max été / Min hiver
                  </span>
                </div>

                <div className="rounded-2xl bg-purple-50 p-4 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                    {lang === 'ar' ? 'البخر نتح (ET0)' : 'Évapotranspiration'}
                  </span>
                  <span className="text-xl font-black text-purple-900 dark:text-purple-100 block mt-1">
                    {activeWilaya.et0} mm/j
                  </span>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300">
                    Demande climatique
                  </span>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    {lang === 'ar' ? 'أيام الصقيع والشهيلي' : 'Gel & Sirocco'}
                  </span>
                  <span className="text-xl font-black text-rose-900 dark:text-rose-100 block mt-1">
                    {activeWilaya.frostDays}j / {activeWilaya.siroccoDays}j
                  </span>
                  <span className="text-[10px] text-rose-700 dark:text-rose-300">
                    Jours de gel / Sirocco
                  </span>
                </div>
              </div>

              {/* Water Resources & Hydraulics Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-sky-500" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {lang === 'ar' ? 'البنية التحتية المائية وشبكات السقي' : 'Infrastructure Hydraulique & Réseau d’Irrigation'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <span className="text-slate-400 block font-bold">
                      {lang === 'ar' ? 'السدود والمجمعات الرئيسية' : 'Grands Barrages / Bassins Versants'}
                    </span>
                    <strong className="text-slate-800 dark:text-slate-100 mt-1 block">
                      {activeWilaya.damOrBasinFr}
                    </strong>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <span className="text-slate-400 block font-bold">
                      {lang === 'ar' ? 'المصادر والطبقات الجوفية' : 'Origine de la Ressource Hydrique'}
                    </span>
                    <strong className="text-slate-800 dark:text-slate-100 mt-1 block">
                      {lang === 'ar' ? activeWilaya.waterSourceAr : activeWilaya.waterSourceFr}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CROPS & PRODUCTION */}
          {activeTab === 'crops' && (
            <div className="space-y-6">
              {/* Crop Badges */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  {lang === 'ar' ? 'الشعب الفلاحية الرئيسية بالولاية' : 'Filières Agricoles Clés & Spécialités'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeWilaya.dominantCrops.map((crop) => (
                    <span
                      key={crop}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                    >
                      <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="capitalize">{crop.replace('_', ' ')}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Produce Highlights Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'المنتجات الرائدة' : 'Produits Phares'}
                </h4>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {lang === 'ar' ? activeWilaya.keyProduceAr : activeWilaya.keyProduceFr}
                </p>
                <div className="border-t border-slate-200 pt-3 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? activeWilaya.agronomicHighlightAr : activeWilaya.agronomicHighlightFr}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ZONE CONTEXT */}
          {activeTab === 'zone_context' && (
            <div className="space-y-6">
              {/* Macro Zone Banner */}
              <div
                className="rounded-2xl p-5 text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${zoneConfig?.color || '#059669'} 0%, #0f172a 100%)`,
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  {lang === 'ar' ? 'الإقليم الفلاحي الأكبر' : 'Zone Agro-Écologique Majeure'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {zoneConfig?.name[lang] || zoneConfig?.name.fr}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  {zoneConfig?.description[lang] || zoneConfig?.description.fr}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/90 border-t border-white/20 pt-3">
                  <span>🌧️ <strong>{zoneConfig?.rainfallRange}</strong></span>
                  <span>🌱 Sols : <strong>{zoneConfig?.dominantSoils}</strong></span>
                  <span>✨ <strong>{zoneConfig?.keySpecialties}</strong></span>
                </div>
              </div>

              {/* All Wilayas in this zone grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  {lang === 'ar'
                    ? `الولايات التابعة لهذا الإقليم (${companionWilayasInZone.length} ولاية):`
                    : `Wilayas appartenant à cette zone (${companionWilayasInZone.length}) :`}
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {companionWilayasInZone.map((w) => {
                    const isCurrent = w.code === activeWilaya.code;
                    return (
                      <button
                        key={w.code}
                        type="button"
                        onClick={() => onSelectWilaya(w.code)}
                        className={`flex items-center justify-between rounded-xl p-2.5 text-xs text-left transition ${
                          isCurrent
                            ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-mono opacity-70 mr-1.5">{w.codeStr}</span>
                          <span>{w.nameFr}</span>
                        </div>
                        <span className="text-[10px] opacity-75 ml-1">{w.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Compass className="h-4 w-4 text-emerald-500" />
            <span>
              {lang === 'ar'
                ? 'نظام المعلومات الجغرافية الفلاحي الجزائري (SIG-AGRI) • قاعدة بيانات INRAA / MADR'
                : 'SIG Agricole National • Référentiel Pédologique & Agronomique INRAA / MADR'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {lang === 'ar' ? 'إغلاق النافذة' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}
