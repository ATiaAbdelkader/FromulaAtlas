'use client';

import { useMemo, useState } from 'react';
import {
  Satellite,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Droplets,
  Sprout,
  ArrowRight,
  Filter,
  BarChart3,
  Download,
  Share2,
} from 'lucide-react';
import {
  ALGERIA_CROP_CYCLE_PRESETS,
  generateNdviTimeSeriesFromPreset,
  type CropCycleAnalysisResult,
  type CropCyclePreset,
  type DetectedCropCycle,
} from '@/lib/crop-cycle-detection';
import { useLanguageStore, type Language } from '@/lib/language-store';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

export default function NasaHarvestCropCycleDetector() {
  const { language } = useLanguageStore();
  const lang: Language = language || 'fr';

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    ALGERIA_CROP_CYCLE_PRESETS[0].id
  );
  const [filterNoise, setFilterNoise] = useState<boolean>(true);
  const [activeCycleHover, setActiveCycleHover] = useState<number | null>(null);

  // Selected Preset
  const currentPreset = useMemo(() => {
    return (
      ALGERIA_CROP_CYCLE_PRESETS.find((p) => p.id === selectedPresetId) ||
      ALGERIA_CROP_CYCLE_PRESETS[0]
    );
  }, [selectedPresetId]);

  // Run Analysis Pipeline
  const analysisResult: CropCycleAnalysisResult = useMemo(() => {
    return generateNdviTimeSeriesFromPreset(currentPreset);
  }, [currentPreset]);

  // Chart formatted data
  const chartData = useMemo(() => {
    return analysisResult.timeSeries.map((pt) => {
      const monthStr = new Date(pt.date).toLocaleDateString(
        lang === 'ar' ? 'ar-DZ' : 'fr-FR',
        { month: 'short', day: 'numeric' }
      );
      return {
        date: pt.date,
        displayLabel: monthStr,
        doy: pt.dayOfYear,
        rawNdvi: pt.rawNdvi,
        smoothedNdvi: pt.smoothedNdvi,
        isCloudNoise: pt.quality === 'cloud_interpolated' ? pt.rawNdvi : null,
      };
    });
  }, [analysisResult, lang]);

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-5 text-white shadow-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 backdrop-blur-xs border border-emerald-400/30">
              <Satellite className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                  NASA Harvest Algorithm
                </span>
                <span className="text-xs text-slate-300 font-medium">Sentinel-2 / Landsat NDVI</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {lang === 'ar'
                  ? 'محدد الدورات المحصولية والظواهر الفينولوجية بالأقمار الصناعية'
                  : 'Détecteur de Cycles Culturaux & Phénologie par Satellite'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterNoise(!filterNoise)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterNoise
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'فلتر ويتيكر لتنقية الإشارة' : 'Filtre Whittaker / Lissage'}</span>
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-300 max-w-3xl">
          {lang === 'ar'
            ? 'تطبيق خوارزمية وكالة ناسا هارفست العالمية للكشف الآلي عن شدة الزراعة (زراعة أحادية، مزدوجة، ثلاثية، أو بور) وتحديد محطات البزوغ الأخضر (SOS)، قمة التغطية (POS)، والحصاد (EOS) عبر السلاسل الزمنية لمؤشر NDVI.'
            : 'Modèle agnostique NASA Harvest pour détecter le nombre de cycles annuels (monoculture, double/triple culture sous pivot, jachère) et dater précisément le verdissement (SOS), le pic végétatif (POS) et la sénescence/récolte (EOS).'}
        </p>
      </div>

      {/* Preset Selector Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {ALGERIA_CROP_CYCLE_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              onClick={() => setSelectedPresetId(preset.id)}
              className={`flex flex-col items-start justify-between rounded-2xl p-3.5 text-left transition-all border ${
                isSelected
                  ? 'bg-white shadow-md border-emerald-600 ring-2 ring-emerald-500/20 dark:bg-slate-900 dark:border-emerald-500'
                  : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {preset.wilaya}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      preset.cyclesCount === 2
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : preset.cyclesCount === 3
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : preset.cyclesCount === 1
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {preset.cyclesCount === 0
                      ? lang === 'ar'
                        ? 'بور'
                        : '0 Cycle'
                      : `${preset.cyclesCount} ${
                          lang === 'ar' ? 'دورات' : preset.cyclesCount > 1 ? 'Cycles' : 'Cycle'
                        }`}
                  </span>
                </div>
                <h4 className="mt-1 text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {lang === 'ar' ? preset.nameAr : preset.nameFr}
                </h4>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {lang === 'ar' ? preset.croppingPatternAr : preset.croppingPatternFr}
              </p>
            </button>
          );
        })}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold">
              {lang === 'ar' ? 'كثافة الدورات المحصولية' : 'Intensité Culturale'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {analysisResult.totalCyclesDetected}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {lang === 'ar'
                ? analysisResult.croppingIntensityLabelAr
                : analysisResult.croppingIntensityLabel}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Activity className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-semibold">
              {lang === 'ar' ? 'قمة الغطاء النباتي (Max NDVI)' : 'Pic de Végétation (Max)'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
              {analysisResult.annualMaxNdvi.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500">
              Moy: {analysisResult.annualMeanNdvi.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold">
              {lang === 'ar' ? 'تكامل الكتلة الحيوية (iNDVI)' : 'Biomasse Intégrale (iNDVI)'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {analysisResult.totalBiomassIntegral}
            </span>
            <span className="text-[11px] text-slate-500">
              {lang === 'ar' ? 'مؤشر الإنتاجية' : 'Indice de vigueur'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-semibold">
              {lang === 'ar' ? 'توافق الرزنامة والمواعيد' : 'Statut Phénologique'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-sm font-black ${
                analysisResult.anomalyAssessment.delayStatus === 'on_schedule'
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
            >
              {analysisResult.anomalyAssessment.delayStatus === 'on_schedule'
                ? lang === 'ar'
                  ? '✓ في الموعد المثالي'
                  : '✓ Conforme au calendrier'
                : lang === 'ar'
                ? `تأخر طفيف (+${analysisResult.anomalyAssessment.delayDaysVsBaseline} يوم)`
                : `Léger décalage (+${analysisResult.anomalyAssessment.delayDaysVsBaseline} j)`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Time Series Chart */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span>
                {lang === 'ar'
                  ? 'المنحنى الزمني الفينولوجي لمؤشر NDVI على مدار 365 يوماً'
                  : 'Courbe Phénologique Temporelle NDVI (365 Jours)'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'إعادة بناء ديناميكية الغطاء النباتي وتحديد قمم الحصاد وفترات البزوغ'
                : 'Reconstruction du profil végétatif et détection des seuils de développement'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">NDVI Lissé</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">NDVI Brut (Sentinel-2)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="displayLabel" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-900 p-2.5 text-xs text-white shadow-lg border border-slate-700">
                        <div className="font-bold text-emerald-400">{data.date}</div>
                        <div className="mt-1 space-y-0.5">
                          <div>
                            NDVI Lissé:{' '}
                            <span className="font-mono font-bold text-white">
                              {data.smoothedNdvi}
                            </span>
                          </div>
                          <div className="text-slate-400">
                            NDVI Brut:{' '}
                            <span className="font-mono">{data.rawNdvi}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0.15} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Sol Nu (0.15)', position: 'insideBottomRight', fill: '#ef4444', fontSize: 10 }} />
              
              <Area
                type="monotone"
                dataKey="smoothedNdvi"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#ndviFill)"
                name="NDVI Lissé"
              />
              {!filterNoise && (
                <Line
                  type="monotone"
                  dataKey="rawNdvi"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={{ r: 1.5 }}
                  name="NDVI Brut"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detected Crop Cycles Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-600" />
          <span>
            {lang === 'ar'
              ? 'تفاصيل الدورات المحصولية المكتشفة وتواريخ الفينولوجيا'
              : 'Détail des Cycles Culturaux Détectés & Dates Phénologiques Clés'}
          </span>
        </h3>

        {analysisResult.cycles.length === 0 ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {lang === 'ar'
                ? 'لم يتم تسجيل أي نشاط زراعي نشط خلال هذه الفترة (الأرض في حالة بور أو رعي طبيعي).'
                : 'Aucune rotation culturale active détectée sur cette période (Parcelle en jachère ou couvert naturel).'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {analysisResult.cycles.map((cycle) => (
              <div
                key={cycle.cycleIndex}
                className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-xs border border-slate-200 dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {cycle.cycleIndex}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? cycle.cropNameCandidateAr : cycle.cropNameCandidateFr}
                    </h4>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {cycle.irrigationModality.toUpperCase()}
                  </span>
                </div>

                {/* Phenology Milestones */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                    <div className="text-[10px] font-semibold text-slate-400">SOS (Verdissement)</div>
                    <div className="mt-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {cycle.sosDate}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-mono">NDVI: {cycle.sosNdvi}</div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60">
                    <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      POS (Pic Végétatif)
                    </div>
                    <div className="mt-1 text-[11px] font-extrabold text-emerald-950 dark:text-white">
                      {cycle.posDate}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono font-bold">
                      NDVI: {cycle.posNdvi}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                    <div className="text-[10px] font-semibold text-slate-400">EOS (Récolte)</div>
                    <div className="mt-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {cycle.eosDate}
                    </div>
                    <div className="text-[10px] text-amber-600 font-mono">NDVI: {cycle.eosNdvi}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span>
                    {lang === 'ar' ? 'مدة الدورة (LOS):' : 'Durée du cycle (LOS) :'}
                    <strong className="text-slate-800 dark:text-slate-200 ml-1">
                      {cycle.durationDays} {lang === 'ar' ? 'يوم' : 'jours'}
                    </strong>
                  </span>
                  <span>
                    {lang === 'ar' ? 'الثقة النموذجية:' : 'Indice de confiance :'}{' '}
                    <strong className="text-emerald-600">{Math.round(cycle.confidence * 100)}%</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agronomic Recommendations & Anomaly Box */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
              {lang === 'ar' ? 'التشخيص الزراعي الفينولوجي' : 'Diagnostic Agronomique & Potentiel Rendement'}
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {lang === 'ar'
                ? analysisResult.anomalyAssessment.notesAr
                : analysisResult.anomalyAssessment.notesFr}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
