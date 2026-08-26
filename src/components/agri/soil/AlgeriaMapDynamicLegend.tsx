'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Sprout,
  Mountain,
  Droplets,
  CloudRain,
  ShieldAlert,
  Info,
  Sparkles,
  Filter,
  Check,
  HelpCircle,
  Eye,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useLanguageStore, type Language } from '@/lib/language-store';
import {
  SOIL_CLASSES_INFO,
  ALGERIA_AGRO_ZONES_CONFIG,
  type AlgeriaSoilClass,
  type AlgeriaAgroZone,
} from '@/lib/algeria-map-data';
import { ALL_58_WILAYAS, type WilayaDataFull } from '@/lib/algeria-wilayas-58';

interface AlgeriaMapDynamicLegendProps {
  activeLayer: string;
  filterSoil: string;
  onSelectSoilFilter: (soilId: string) => void;
  selectedWilaya: WilayaDataFull;
  onSelectWilaya?: (code: number) => void;
  onOpenRegionalPopup?: (wilaya?: WilayaDataFull, zone?: AlgeriaAgroZone) => void;
  selectedCropId?: string;
  className?: string;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  defaultExpanded?: boolean;
  storageKey?: string;
}

type LegendTab = 'soils' | 'zones' | 'active_layer';

export default function AlgeriaMapDynamicLegend({
  activeLayer,
  filterSoil,
  onSelectSoilFilter,
  selectedWilaya,
  onSelectWilaya,
  onOpenRegionalPopup,
  selectedCropId,
  className = '',
  isExpanded: controlledExpanded,
  onToggleExpanded,
  defaultExpanded = true,
  storageKey = 'algeria_agri_map_legend_expanded',
}: AlgeriaMapDynamicLegendProps) {
  const { language } = useLanguageStore();
  const lang: Language = language || 'fr';

  const [internalExpanded, setInternalExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {
        // ignore localStorage error
      }
    }
    return defaultExpanded;
  });

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = (nextVal: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(nextVal);
    }
    onToggleExpanded?.(nextVal);
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, String(nextVal));
      } catch {
        // ignore localStorage error
      }
    }
  };

  const [activeTab, setActiveTab] = useState<LegendTab>('soils');
  const [hoveredSoilId, setHoveredSoilId] = useState<AlgeriaSoilClass | null>(null);

  // Count wilayas per soil class
  const wilayasBySoilCount = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_58_WILAYAS.forEach((w) => {
      counts[w.dominantSoil] = (counts[w.dominantSoil] || 0) + 1;
    });
    return counts;
  }, []);

  // Count wilayas per agro zone
  const wilayasByZoneCount = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_58_WILAYAS.forEach((w) => {
      counts[w.zone] = (counts[w.zone] || 0) + 1;
    });
    return counts;
  }, []);

  const soilList = Object.entries(SOIL_CLASSES_INFO) as [
    AlgeriaSoilClass,
    (typeof SOIL_CLASSES_INFO)[AlgeriaSoilClass],
  ][];

  const zoneList = Object.entries(ALGERIA_AGRO_ZONES_CONFIG) as [
    AlgeriaAgroZone,
    (typeof ALGERIA_AGRO_ZONES_CONFIG)[AlgeriaAgroZone],
  ][];

  // Active soil info when hovered
  const activeHoveredSoil = hoveredSoilId ? SOIL_CLASSES_INFO[hoveredSoilId] : null;

  return (
    <div
      className={`pointer-events-auto absolute bottom-3 right-3 z-30 flex flex-col items-end transition-all duration-200 ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Collapsed Pill Button */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => handleToggle(true)}
          className="group flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xl backdrop-blur-md transition hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          title={lang === 'ar' ? 'عرض دليل الألوان والخريطة' : 'Afficher la légende cartographique'}
          aria-expanded={false}
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ar' ? 'دليل الخريطة والتربة' : 'Légende des Sols & Zones'}</span>
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-transform" />
        </button>
      ) : (
        /* Expanded Legend Box */
        <div
          className="w-[320px] sm:w-[360px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 transition-all animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => handleToggle(false)}
              title={lang === 'ar' ? 'انقر لتصغير الدليل' : 'Cliquer pour réduire la légende'}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                <Layers className="h-3 w-3" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {lang === 'ar' ? 'دليل الألوان والتربة (SIG)' : 'Légende Dynamique des Sols'}
                </h4>
                <p className="text-[10px] text-slate-400 leading-none">
                  {lang === 'ar'
                    ? 'تصنيف FAO / INRAA وخرائط الأقاليم'
                    : 'Référentiel Pédologique INRAA / FAO'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {filterSoil !== 'all' && (
                <button
                  type="button"
                  onClick={() => onSelectSoilFilter('all')}
                  className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300"
                  title="Réinitialiser le filtre de sol"
                >
                  {lang === 'ar' ? 'إلغاء التصفية' : 'Effacer filtre'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleToggle(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                title={lang === 'ar' ? 'تصغير الدليل' : 'Réduire la légende'}
                aria-expanded={true}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sub-Tabs: Sols / Zones / Couche Active */}
          <div className="flex items-center gap-1 border-b border-slate-100 bg-white px-3 py-1.5 text-[11px] font-bold dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('soils')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1 transition ${
                activeTab === 'soils'
                  ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Sprout className="h-3 w-3" />
              <span>{lang === 'ar' ? 'أنواع التربة' : 'Classes de Sols'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('zones')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1 transition ${
                activeTab === 'zones'
                  ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Mountain className="h-3 w-3" />
              <span>{lang === 'ar' ? 'الأقاليم الفلاحية' : 'Zones Agro'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('active_layer')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1 transition ${
                activeTab === 'active_layer'
                  ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>{lang === 'ar' ? 'الطبقة الحالية' : 'Thématique'}</span>
            </button>
          </div>

          {/* Tab 1: Soil Classes List */}
          {activeTab === 'soils' && (
            <div className="p-2.5 max-h-[260px] overflow-y-auto space-y-1.5">
              <div className="text-[10px] text-slate-400 px-1 font-medium flex justify-between items-center">
                <span>{lang === 'ar' ? 'انقر لتصفية الخريطة حسب التربة' : 'Cliquer pour filtrer la carte :'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{soilList.length} types</span>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {soilList.map(([soilKey, info]) => {
                  const isSelectedFilter = filterSoil === soilKey;
                  const isWilayaSoil = selectedWilaya?.dominantSoil === soilKey;
                  const count = wilayasBySoilCount[soilKey] || 0;

                  return (
                    <div
                      key={soilKey}
                      onMouseEnter={() => setHoveredSoilId(soilKey)}
                      onMouseLeave={() => setHoveredSoilId(null)}
                      onClick={() => onSelectSoilFilter(isSelectedFilter ? 'all' : soilKey)}
                      className={`group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition cursor-pointer border ${
                        isSelectedFilter
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-500'
                          : 'border-transparent bg-slate-50/70 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {/* Color Swatch */}
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/80 shadow-2xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: info.color }}
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-[11px] text-slate-900 dark:text-slate-100">
                              {info.name[lang] || info.name.fr}
                            </span>
                            {isWilayaSoil && (
                              <span
                                className="shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                title="Sol de la wilaya active"
                              >
                                {selectedWilaya.codeStr}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {info.texture}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                          {count} {lang === 'ar' ? 'ولاية' : 'wil.'}
                        </span>
                        {isSelectedFilter && (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover Detail Micro-Card */}
              {activeHoveredSoil && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] shadow-sm dark:border-slate-700 dark:bg-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: activeHoveredSoil.color }}
                    />
                    <span>{activeHoveredSoil.name[lang] || activeHoveredSoil.name.fr}</span>
                  </div>
                  <div className="text-[10px] text-rose-600 dark:text-rose-400">
                    ⚠️ <strong>{lang === 'ar' ? 'التحدي:' : 'Contrainte:'}</strong>{' '}
                    {activeHoveredSoil.keyChallenge[lang] || activeHoveredSoil.keyChallenge.fr}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    ✅ <strong>{lang === 'ar' ? 'المحسنات:' : 'Amendements:'}</strong>{' '}
                    {activeHoveredSoil.recommendedAmendments[lang] ||
                      activeHoveredSoil.recommendedAmendments.fr}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Agro-Ecological Zones */}
          {activeTab === 'zones' && (
            <div className="p-2.5 max-h-[260px] overflow-y-auto space-y-2">
              <div className="text-[10px] text-slate-400 px-1 font-medium">
                {lang === 'ar'
                  ? 'الأقاليم الفلاحية الكبرى بالجزائر (INRAA)'
                  : 'Grands Domaines Agro-Écologiques Nationaux :'}
              </div>

              {zoneList.map(([zoneKey, config]) => {
                const isSelectedWilayaZone = selectedWilaya?.zone === zoneKey;
                const count = wilayasByZoneCount[zoneKey] || 0;

                return (
                  <div
                    key={zoneKey}
                    onClick={() => {
                      if (onOpenRegionalPopup) {
                        onOpenRegionalPopup(selectedWilaya, zoneKey);
                      }
                    }}
                    className={`group rounded-xl border p-2 text-xs transition cursor-pointer ${
                      isSelectedWilayaZone
                        ? 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-600'
                        : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/80 shadow-2xs"
                          style={{ backgroundColor: config.color }}
                        />
                        <strong className="text-[11px] text-slate-800 dark:text-slate-100 truncate">
                          {config.name[lang] || config.name.fr}
                        </strong>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {count} wil.
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 pt-1 dark:border-slate-700/60">
                      <span>🌧️ {config.rainfallRange}</span>
                      <span className="truncate max-w-[150px]">{config.dominantSoils}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Active Map Layer Specific Legend */}
          {activeTab === 'active_layer' && (
            <div className="p-3 text-xs space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {lang === 'ar' ? 'الطبقة المفعلة حالياً' : 'Couche SIG Active'}
                </span>
                <strong className="text-sm text-emerald-600 dark:text-emerald-400 block capitalize">
                  {activeLayer.replace('_', ' ')}
                </strong>
              </div>

              {/* Salinity Risk Scale */}
              {activeLayer === 'salinity_risk' && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'مستويات الملوحة (ECe)' : 'Échelle de Salinité :'}
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-cyan-500" /> &lt; 2 dS/m (Négligeable)</span>
                      <span className="text-[10px] text-slate-400">Eau douce</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> 2 - 4 dS/m (Faible)</span>
                      <span className="text-[10px] text-slate-400">Tolérance normale</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" /> 4 - 8 dS/m (Modéré)</span>
                      <span className="text-[10px] text-slate-400">Cultures tolérantes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-rose-600" /> &gt; 8 dS/m (Élevé / Sévère)</span>
                      <span className="text-[10px] text-slate-400">Chotts / Sebkha</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rainfall Scale */}
              {activeLayer === 'rainfall' && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'سلم كمية الأمطار السنوية' : 'Pluviométrie Annuelle :'}
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#0369a1]" /> &gt; 700 mm</span>
                      <span className="text-[10px] text-slate-400">Humide littoral</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#0284c7]" /> 400 - 700 mm</span>
                      <span className="text-[10px] text-slate-400">Subhumide Tell</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#10b981]" /> 250 - 400 mm</span>
                      <span className="text-[10px] text-slate-400">Semi-aride steppes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#f59e0b]" /> 100 - 250 mm</span>
                      <span className="text-[10px] text-slate-400">Aride pré-saharien</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#dc2626]" /> &lt; 100 mm</span>
                      <span className="text-[10px] text-slate-400">Hyper-aride Sahara</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Crop Suitability Scale */}
              {activeLayer === 'crop_suitability' && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'مؤشر الملاءمة الزراعية' : 'Aptitude Pédoclimatique :'}
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-600" />
                      <span><strong>{lang === 'ar' ? 'ملائمة مثالية' : 'Optimale / Recommandée'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                      <span><strong>{lang === 'ar' ? 'متوسطة / مشروطة' : 'Moyenne / Avec Aménagements'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-600" />
                      <span><strong>{lang === 'ar' ? 'غير ملائمة' : 'Contraintes Sévères'}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Soil Types / Agro Zones */}
              {activeLayer !== 'salinity_risk' && activeLayer !== 'rainfall' && activeLayer !== 'crop_suitability' && (
                <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 text-[11px] leading-relaxed">
                  {lang === 'ar'
                    ? 'تعرض الخريطة التوزيع الجغرافي للتربة والأقاليم الفلاحية وفق قاعدة بيانات المعهد الوطني للأبحاث الزراعية (INRAA).'
                    : 'La carte affiche la distribution géographique des sols et des vocations régionales d’après le référentiel INRAA / MADR.'}
                </div>
              )}
            </div>
          )}

          {/* Footer Quick Action */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3.5 py-2 text-[10px] dark:border-slate-800 dark:bg-slate-800/50">
            <span className="text-slate-400">
              {lang === 'ar' ? 'المعهد الوطني للأبحاث الزراعية INRAA' : 'SIG Pédologique Algérie • INRAA'}
            </span>
            {onOpenRegionalPopup && (
              <button
                type="button"
                onClick={() => onOpenRegionalPopup(selectedWilaya, selectedWilaya.zone)}
                className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {lang === 'ar' ? 'الإحصائيات كاملة ←' : 'Stats complètes →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
