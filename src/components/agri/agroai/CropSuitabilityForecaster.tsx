'use client';

import React, { useState, useMemo } from 'react';
import {
  Compass,
  Sprout,
  Thermometer,
  Droplets,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingUp,
  MapPin,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  AGROAI_CROP_PROFILES,
  computeCropSuitability,
  type CropBioclimaticProfile,
  type SuitabilityCalculationInput,
} from '@/lib/agroai-engine';

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

// Algerian Regional Presets
interface WilayaPreset {
  id: string;
  name: { en: string; fr: string; ar: string };
  soilEceDsm: number;
  soilPh: number;
  activeCaCO3Pct: number;
  soilTexture: 'sand' | 'sandy_loam' | 'loam' | 'clay_loam' | 'clay';
  availableGdd: number;
  annualRainfallPlusIrrigationMm: number;
  springFrostRisk: 'none' | 'low' | 'moderate' | 'high';
  siroccoRisk: 'none' | 'low' | 'moderate' | 'extreme';
}

const ALGERIAN_WILAYA_PRESETS: WilayaPreset[] = [
  {
    id: 'high_plateaus_setif',
    name: { en: 'High Plateaus (Sétif / Batna)', fr: 'Hauts Plateaux (Sétif / Batna)', ar: 'الهضاب العليا (سطيف / باتنة)' },
    soilEceDsm: 0.9,
    soilPh: 8.1,
    activeCaCO3Pct: 14,
    soilTexture: 'clay_loam',
    availableGdd: 1850,
    annualRainfallPlusIrrigationMm: 420,
    springFrostRisk: 'high',
    siroccoRisk: 'moderate',
  },
  {
    id: 'mitidja_blida',
    name: { en: 'Mitidja Plain (Blida / Tipaza)', fr: 'Plaine de la Mitidja (Blida / Tipaza)', ar: 'سهل متيجة (البليدة / تيبازة)' },
    soilEceDsm: 1.2,
    soilPh: 7.2,
    activeCaCO3Pct: 5,
    soilTexture: 'loam',
    availableGdd: 2400,
    annualRainfallPlusIrrigationMm: 850,
    springFrostRisk: 'low',
    siroccoRisk: 'low',
  },
  {
    id: 'biskra_ziban',
    name: { en: 'Biskra Ziban (Oases & Greenhouses)', fr: 'Biskra Ziban (Oasis & Serres)', ar: 'بسكرة والزيبان (واحات وبيوت بلاستيكية)' },
    soilEceDsm: 4.8,
    soilPh: 7.8,
    activeCaCO3Pct: 18,
    soilTexture: 'sandy_loam',
    availableGdd: 3300,
    annualRainfallPlusIrrigationMm: 1100, // Groundwater pumped
    springFrostRisk: 'low',
    siroccoRisk: 'extreme',
  },
  {
    id: 'el_oued_souf',
    name: { en: 'El Oued Souf (Desert Sand Pinhole)', fr: 'El Oued Souf (Pivot & Sables)', ar: 'الوادي وسوف (الرمال والمحاور)' },
    soilEceDsm: 3.2,
    soilPh: 8.3,
    activeCaCO3Pct: 6,
    soilTexture: 'sand',
    availableGdd: 3500,
    annualRainfallPlusIrrigationMm: 950,
    springFrostRisk: 'low',
    siroccoRisk: 'extreme',
  },
  {
    id: 'cheliff_valley',
    name: { en: 'Cheliff Valley (Chlef / Ain Defla)', fr: 'Vallée du Chéliff (Chlef / Aïn Defla)', ar: 'وادي الشلف (الشلف / عين الدفلى)' },
    soilEceDsm: 2.1,
    soilPh: 7.9,
    activeCaCO3Pct: 11,
    soilTexture: 'clay_loam',
    availableGdd: 2600,
    annualRainfallPlusIrrigationMm: 600,
    springFrostRisk: 'moderate',
    siroccoRisk: 'high',
  },
];

export default function CropSuitabilityForecaster() {
  const { language } = useTranslation();

  const [selectedCropId, setSelectedCropId] = useState<string>('durum_wheat');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('high_plateaus_setif');

  // Input states
  const [soilEceDsm, setSoilEceDsm] = useState<number>(0.9);
  const [soilPh, setSoilPh] = useState<number>(8.1);
  const [activeCaCO3Pct, setActiveCaCO3Pct] = useState<number>(14);
  const [soilTexture, setSoilTexture] = useState<'sand' | 'sandy_loam' | 'loam' | 'clay_loam' | 'clay'>('clay_loam');
  const [availableGdd, setAvailableGdd] = useState<number>(1850);
  const [annualRainfallPlusIrrigationMm, setAnnualRainfallPlusIrrigationMm] = useState<number>(420);
  const [springFrostRisk, setSpringFrostRisk] = useState<'none' | 'low' | 'moderate' | 'high'>('high');
  const [siroccoRisk, setSiroccoRisk] = useState<'none' | 'low' | 'moderate' | 'extreme'>('moderate');

  // Apply Algerian Preset
  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = ALGERIAN_WILAYA_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setSoilEceDsm(p.soilEceDsm);
    setSoilPh(p.soilPh);
    setActiveCaCO3Pct(p.activeCaCO3Pct);
    setSoilTexture(p.soilTexture);
    setAvailableGdd(p.availableGdd);
    setAnnualRainfallPlusIrrigationMm(p.annualRainfallPlusIrrigationMm);
    setSpringFrostRisk(p.springFrostRisk);
    setSiroccoRisk(p.siroccoRisk);
  };

  const currentCrop = useMemo(() => {
    return AGROAI_CROP_PROFILES.find((c) => c.cropId === selectedCropId) || AGROAI_CROP_PROFILES[0];
  }, [selectedCropId]);

  // Compute multi-factor suitability score
  const result = useMemo(() => {
    const input: SuitabilityCalculationInput = {
      cropId: selectedCropId,
      soilEceDsm,
      soilPh,
      activeCaCO3Pct,
      soilTexture,
      availableGdd,
      annualRainfallPlusIrrigationMm,
      springFrostRisk,
      siroccoRisk,
    };
    return computeCropSuitability(input);
  }, [
    selectedCropId,
    soilEceDsm,
    soilPh,
    activeCaCO3Pct,
    soilTexture,
    availableGdd,
    annualRainfallPlusIrrigationMm,
    springFrostRisk,
    siroccoRisk,
  ]);

  // Maas-Hoffman Salinity Sensitivity Curve Points (0 to 12 dS/m)
  const salinityCurve = useMemo(() => {
    const points = [0, 1.5, 3.0, 4.5, 6.0, 8.0, 10.0, 12.0];
    return points.map((ec) => {
      let y = 100;
      if (ec > currentCrop.salinityThresholdA) {
        y = Math.max(0, 100 - currentCrop.salinitySlopeB * (ec - currentCrop.salinityThresholdA));
      }
      return {
        ec,
        yieldPct: Math.round(y),
        isCurrent: Math.abs(ec - soilEceDsm) < 1.0,
      };
    });
  }, [currentCrop, soilEceDsm]);

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-xs">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
                {tr(language, 'AgroAI Bio-Climatic Model', 'النموذج المناخي الحيوي (AgroAI)', 'Modèle Bio-Climatique AgroAI')}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold border-teal-300 text-teal-700">
                Maas-Hoffman & GDD Model
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {tr(
                language,
                'Multi-Factor Bio-Climatic & Edaphic Crop Suitability Forecaster',
                'المتنبئ متعدد العوامل لملاءمة المحاصيل للمناخ والتربة',
                'Prévisionniste Multi-Facteurs d’Aptitude Pédo-Climatique'
              )}
            </h3>
          </div>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            {tr(language, 'Crop to evaluate:', 'المحصول المستهدف:', 'Culture à évaluer :')}
          </label>
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            {AGROAI_CROP_PROFILES.map((crop) => (
              <option key={crop.cropId} value={crop.cropId}>
                {crop.emoji} {crop.name[language]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* REGIONAL PRESET BUTTONS */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 p-3 border border-border">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-teal-600" />
          {tr(language, 'Algerian Agro-Ecological Presets:', 'نماذج الأقاليم الجزائرية:', 'Préréglages Régionaux :')}
        </span>
        {ALGERIAN_WILAYA_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleApplyPreset(preset.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedPresetId === preset.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground border border-border hover:bg-muted'
            }`}
          >
            {preset.name[language]}
          </button>
        ))}
      </div>

      {/* OVERALL SUITABILITY SCORE & HARVEST FORECAST HERO */}
      <div
        className={`rounded-2xl border p-5 shadow-xs transition-all ${
          result.status === 'highly_suitable'
            ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20'
            : result.status === 'suitable'
            ? 'border-teal-300 bg-teal-50/70 dark:border-teal-900/60 dark:bg-teal-950/20'
            : result.status === 'marginally_suitable'
            ? 'border-amber-300 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20'
            : 'border-rose-300 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20'
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCrop.emoji}</span>
              <h4 className="text-lg font-black text-foreground">
                {currentCrop.name[language]}
              </h4>
              <Badge
                className={
                  result.status === 'highly_suitable'
                    ? 'bg-emerald-600 text-white'
                    : result.status === 'suitable'
                    ? 'bg-teal-600 text-white'
                    : result.status === 'marginally_suitable'
                    ? 'bg-amber-600 text-white'
                    : 'bg-rose-600 text-white'
                }
              >
                {result.statusLabel[language]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {tr(
                language,
                `Bioclimatic Potential vs Salinity (Maas-Hoffman threshold a = ${currentCrop.salinityThresholdA} dS/m, b = ${currentCrop.salinitySlopeB}%/dS/m).`,
                `القدرة البيومناخية مقابل الملوحة (حد ماس-هوفمان a = ${currentCrop.salinityThresholdA} ديسي سيمنز/م).`,
                `Potentiel bioclimatique vs Salinité (Seuil Maas-Hoffman a = ${currentCrop.salinityThresholdA} dS/m).`
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Main Suitability Gauge */}
            <div className="text-center rounded-xl bg-card/90 p-3 border border-border shadow-xs min-w-[120px]">
              <span className="text-[10px] font-semibold text-muted-foreground block">
                {tr(language, 'Suitability Score', 'مؤشر الملاءمة الكلي', 'Score d’Aptitude')}
              </span>
              <span className="text-2xl font-black text-teal-700 dark:text-teal-300">
                {result.overallScorePct}%
              </span>
            </div>

            {/* Expected Yield */}
            <div className="text-center rounded-xl bg-card/90 p-3 border border-border shadow-xs min-w-[140px]">
              <span className="text-[10px] font-semibold text-muted-foreground block">
                {tr(language, 'Projected Yield', 'المردود المتوقع', 'Rendement Prévu')}
              </span>
              <span className="text-2xl font-black text-foreground">
                {result.expectedYieldTonsHa} <span className="text-xs font-normal">t/ha</span>
              </span>
              <span className="text-[9px] text-muted-foreground block">
                (Max: {currentCrop.targetYieldPotentialTonsHa} t/ha)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-COLUMN INTERACTIVE EDAPHIC & CLIMATIC TUNERS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* COLUMN 1: EDAPHIC / SOIL PARAMETERS */}
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-700" />
            <h4 className="text-sm font-bold text-foreground">
              {tr(language, '1. Edaphic & Soil Salinity Inputs', '١. معايير التربة والملوحة', '1. Paramètres Sol & Salinité')}
            </h4>
          </div>

          {/* Salinity ECe */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-muted-foreground">
                {tr(language, 'Soil Salinity (ECe):', 'ملوحة مستخلص التربة ECe:', 'Salinité extrait saturé (ECe) :')}
              </span>
              <span className="font-bold font-mono text-foreground">{soilEceDsm} dS/m</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="15.0"
              step="0.1"
              value={soilEceDsm}
              onChange={(e) => setSoilEceDsm(Number(e.target.value))}
              className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0.2 (Doux)</span>
              <span>{currentCrop.salinityThresholdA} (Seuil crop)</span>
              <span>15.0 (Très Salin)</span>
            </div>
          </div>

          {/* Soil pH */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-muted-foreground">
                {tr(language, 'Soil pH (H₂O):', 'درجة حموضة التربة pH:', 'pH du sol (H₂O) :')}
              </span>
              <span className="font-bold font-mono text-foreground">{soilPh}</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="9.5"
              step="0.1"
              value={soilPh}
              onChange={(e) => setSoilPh(Number(e.target.value))}
              className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Active Limestone */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-muted-foreground">
                {tr(language, 'Active Limestone (CaCO₃ actif):', 'الكلس الفعال:', 'Calcaire Actif (%) :')}
              </span>
              <span className="font-bold font-mono text-foreground">{activeCaCO3Pct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={activeCaCO3Pct}
              onChange={(e) => setActiveCaCO3Pct(Number(e.target.value))}
              className="w-full accent-slate-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Soil Texture */}
          <div className="text-xs">
            <label className="font-semibold text-muted-foreground block mb-1">
              {tr(language, 'Soil Texture:', 'قوام التربة:', 'Texture du sol :')}
            </label>
            <select
              value={soilTexture}
              onChange={(e) => setSoilTexture(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold"
            >
              <option value="sand">Sableux (Sand)</option>
              <option value="sandy_loam">Limono-Sableux (Sandy Loam)</option>
              <option value="loam">Franc / Équilibré (Loam)</option>
              <option value="clay_loam">Argilo-Limoneux (Clay Loam)</option>
              <option value="clay">Argileux Lourd (Heavy Clay)</option>
            </select>
          </div>
        </div>

        {/* COLUMN 2: THERMAL GDD & WATER BALANCE */}
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-rose-600" />
            <h4 className="text-sm font-bold text-foreground">
              {tr(language, '2. Thermal & Water Supply', '٢. الاحتياجات الحرارية والمائية', '2. Thermie & Alimentation Hydrique')}
            </h4>
          </div>

          {/* Accumulated GDD */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-muted-foreground">
                {tr(language, 'Thermal GDD (Base Tb):', 'المجموع الحراري GDD:', 'Degrés-Jours Cumulés (GDD) :')}
              </span>
              <span className="font-bold font-mono text-foreground">
                {availableGdd} °C-j (Requis: {currentCrop.requiredGddTotal})
              </span>
            </div>
            <input
              type="range"
              min="800"
              max="4200"
              step="50"
              value={availableGdd}
              onChange={(e) => setAvailableGdd(Number(e.target.value))}
              className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Rainfall + Irrigation */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-muted-foreground">
                {tr(language, 'Rainfall + Irrigation Budget:', 'الميزانية المائية (أمطار + ري):', 'Pluie + Irrigation Totale :')}
              </span>
              <span className="font-bold font-mono text-foreground">
                {annualRainfallPlusIrrigationMm} mm (Besoin: {currentCrop.waterReqMmPerCycle} mm)
              </span>
            </div>
            <input
              type="range"
              min="150"
              max="1500"
              step="25"
              value={annualRainfallPlusIrrigationMm}
              onChange={(e) => setAnnualRainfallPlusIrrigationMm(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Spring Frost Risk */}
          <div className="text-xs">
            <label className="font-semibold text-muted-foreground block mb-1">
              {tr(language, 'Spring Frost Hazard:', 'خطر الصقيع الربيعي:', 'Risque de Gel Printanier :')}
            </label>
            <select
              value={springFrostRisk}
              onChange={(e) => setSpringFrostRisk(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold"
            >
              <option value="none">Nul / Absent (None)</option>
              <option value="low">Faible / Rare (Low)</option>
              <option value="moderate">Modéré (Moderate)</option>
              <option value="high">Élevé / Récurrent (High)</option>
            </select>
          </div>

          {/* Sirocco Risk */}
          <div className="text-xs">
            <label className="font-semibold text-muted-foreground block mb-1">
              {tr(language, 'Sirocco Heatwave Hazard:', 'خطر رياح السيروكو الحارة:', 'Risque Vague de Chaleur / Sirocco :')}
            </label>
            <select
              value={siroccoRisk}
              onChange={(e) => setSiroccoRisk(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-card p-2 text-xs font-semibold"
            >
              <option value="none">Nul (None)</option>
              <option value="low">Faible (Low)</option>
              <option value="moderate">Modéré (Moderate)</option>
              <option value="extreme">Extrême / Saharien (Extreme)</option>
            </select>
          </div>
        </div>

        {/* COLUMN 3: MAAS-HOFFMAN CURVE & REMEDIATIONS */}
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-foreground">
              {tr(language, '3. Maas-Hoffman Salinity Curve', '٣. منحنى ماس-هوفمان للملوحة', '3. Courbe Salinité Maas-Hoffman')}
            </h4>
          </div>

          {/* Mini Curve Points */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Salinité ECe (dS/m)</span>
              <span>Rendement Relatif %</span>
            </div>
            <div className="space-y-1.5">
              {salinityCurve.map((pt) => (
                <div
                  key={pt.ec}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1 text-xs border ${
                    pt.isCurrent
                      ? 'border-amber-400 bg-amber-50 font-bold dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-border bg-card'
                  }`}
                >
                  <span className="font-mono">{pt.ec} dS/m</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pt.yieldPct}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold w-9 text-right">{pt.yieldPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limiting Factors & Agronomic Mitigations */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900/60 dark:bg-teal-950/20 text-xs space-y-2">
            <span className="font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              {tr(language, 'Agronomic Action Plan:', 'خطة التدخل الزراعي المقترحة:', 'Plan d’Action Agronomique :')}
            </span>
            {result.agronomicMitigations.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-[11px] text-teal-900 dark:text-teal-300">
                {result.agronomicMitigations.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                ✓ All edaphic and bioclimatic parameters are optimal for maximum theoretical yield.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
