'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Wind,
  Droplets,
  Thermometer,
  FileSpreadsheet,
  Download,
  Info,
  Bug,
  Waves,
  Eye,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  AGROAI_CHEMICAL_DATABASE,
  type ChemicalSubstance,
} from '@/lib/agroai-engine';

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

export default function ChemicalHealthTracker() {
  const { language } = useTranslation();

  const [selectedSubstanceId, setSelectedSubstanceId] = useState<string>('deltamethrin');
  const [plannedSprayingDate, setPlannedSprayingDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [plannedSprayingTime, setPlannedSprayingTime] = useState<string>('07:30');
  const [plannedHarvestDate, setPlannedHarvestDate] = useState<string>(() => {
    const harvest = new Date();
    harvest.setDate(harvest.getDate() + 10);
    return harvest.toISOString().split('T')[0];
  });

  // Current weather conditions for safe spraying evaluation
  const [currentWindKmh, setCurrentWindKmh] = useState<number>(8);
  const [currentTempC, setCurrentTempC] = useState<number>(22);
  const [currentHumidityPct, setCurrentHumidityPct] = useState<number>(60);

  const chemical = useMemo(() => {
    return (
      AGROAI_CHEMICAL_DATABASE.find((c) => c.id === selectedSubstanceId) ||
      AGROAI_CHEMICAL_DATABASE[0]
    );
  }, [selectedSubstanceId]);

  // Calculations for REI and PHI
  const timingCalculations = useMemo(() => {
    const sprayDateTime = new Date(`${plannedSprayingDate}T${plannedSprayingTime}:00`);
    
    // Safe Re-Entry Date/Time
    const reiExpiry = new Date(sprayDateTime.getTime() + chemical.reiHours * 60 * 60 * 1000);

    // Safe Harvest Date
    const phiExpiry = new Date(sprayDateTime.getTime() + chemical.phiDays * 24 * 60 * 60 * 1000);
    const plannedHarvest = new Date(`${plannedHarvestDate}T12:00:00`);

    const daysUntilSafeHarvest = Math.ceil(
      (phiExpiry.getTime() - sprayDateTime.getTime()) / (24 * 60 * 60 * 1000)
    );
    const daysBetweenSprayAndHarvest = Math.ceil(
      (plannedHarvest.getTime() - sprayDateTime.getTime()) / (24 * 60 * 60 * 1000)
    );

    const isHarvestSafe = daysBetweenSprayAndHarvest >= chemical.phiDays;
    const harvestMarginDays = daysBetweenSprayAndHarvest - chemical.phiDays;

    return {
      sprayDateTime,
      reiExpiry,
      phiExpiry,
      daysUntilSafeHarvest,
      daysBetweenSprayAndHarvest,
      isHarvestSafe,
      harvestMarginDays,
    };
  }, [chemical, plannedSprayingDate, plannedSprayingTime, plannedHarvestDate]);

  // Delta T Calculation: Delta T (°C) ≈ Dry Bulb Temp - Wet Bulb Temp
  // Simplified approximation for spray drift risk
  const deltaT = useMemo(() => {
    // Relative approximation: Delta T = T * (1 - RH/100) * 0.75 + (T - 20) * 0.1
    const dt = currentTempC * (1 - currentHumidityPct / 100) * 0.8;
    return parseFloat(Math.max(0.5, dt).toFixed(1));
  }, [currentTempC, currentHumidityPct]);

  // Weather safety assessment
  const weatherAuditor = useMemo(() => {
    const windOk = currentWindKmh <= chemical.safeSprayingConditions.maxWindSpeedKmh;
    const tempOk = currentTempC <= chemical.safeSprayingConditions.maxTempC;
    const humidityOk = currentHumidityPct >= chemical.safeSprayingConditions.minHumidityPct;
    const deltaTOk =
      deltaT >= chemical.safeSprayingConditions.idealDeltaT.min &&
      deltaT <= chemical.safeSprayingConditions.idealDeltaT.max;

    const overallSafe = windOk && tempOk && humidityOk && deltaTOk;

    return {
      windOk,
      tempOk,
      humidityOk,
      deltaTOk,
      overallSafe,
    };
  }, [chemical, currentWindKmh, currentTempC, currentHumidityPct, deltaT]);

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-xs">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-400">
                {tr(language, 'AgroAI Operator Safety', 'سلامة العامل الزراعي (AgroAI)', 'Sécurité Applicateur AgroAI')}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold border-rose-300 text-rose-700">
                WHO Class & PPE Tracker
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {tr(
                language,
                'Chemical Usage & Human Health Impact Tracker',
                'متتبع استخدام المواد الكيميائية والتأثير على صحة الإنسان',
                'Suivi de l’Usage Chimique & Impact Santé Humaine'
              )}
            </h3>
          </div>
        </div>

        {/* Substance Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            {tr(language, 'Active Substance:', 'المادة الفعالة:', 'Matière active :')}
          </label>
          <select
            value={selectedSubstanceId}
            onChange={(e) => setSelectedSubstanceId(e.target.value)}
            className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            {AGROAI_CHEMICAL_DATABASE.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tradeName} ({item.whoClassLabel[language]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUBSTANCE OVERVIEW BANNER */}
      <div
        className="rounded-2xl border p-5 shadow-xs transition-all"
        style={{
          borderColor: `${chemical.whoColor}50`,
          backgroundColor: `${chemical.whoColor}10`,
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-black text-white"
                style={{ backgroundColor: chemical.whoColor }}
              >
                WHO {chemical.whoClass}
              </span>
              <h4 className="text-base font-black text-foreground">{chemical.tradeName}</h4>
              <Badge variant="secondary" className="text-[10px]">
                {chemical.iracFracHracCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {tr(language, 'Active Substance:', 'المادة الفعالة:', 'Substance active :')}{' '}
              <strong className="text-foreground">{chemical.activeSubstance}</strong> |{' '}
              {tr(language, 'Dose:', 'الجرعة الموصى بها:', 'Dose homologuée :')}{' '}
              <strong className="text-foreground">{chemical.recommendedDosePerHa}</strong>
            </p>
          </div>

          {/* Quick Critical Metrics */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="rounded-xl bg-card/80 p-2.5 border border-border text-center min-w-[85px]">
              <span className="text-[10px] font-semibold text-muted-foreground block">
                {tr(language, 'REI / DRE', 'مهلة الدخول', 'Délai Réentrée')}
              </span>
              <span className="text-base font-black text-rose-600">
                {chemical.reiHours} {tr(language, 'hrs', 'ساعة', 'h')}
              </span>
            </div>
            <div className="rounded-xl bg-card/80 p-2.5 border border-border text-center min-w-[85px]">
              <span className="text-[10px] font-semibold text-muted-foreground block">
                {tr(language, 'PHI / DAR', 'مهلة الجني', 'Délai Avant Récolte')}
              </span>
              <span className="text-base font-black text-amber-600">
                {chemical.phiDays} {tr(language, 'days', 'يوم', 'jours')}
              </span>
            </div>
            <div className="rounded-xl bg-card/80 p-2.5 border border-border text-center min-w-[85px]">
              <span className="text-[10px] font-semibold text-muted-foreground block">
                {tr(language, 'Oral LD50', 'السمية الفموية LD50', 'LD50 Orale')}
              </span>
              <span className="text-xs font-bold text-foreground">
                {chemical.oralLd50MgKg} mg/kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE 3-COLUMN DASHBOARD */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* COLUMN 1: MANDATORY PPE (EPI) COMPLIANCE PROTOCOL */}
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <h4 className="text-sm font-bold text-foreground">
              {tr(
                language,
                'Mandatory PPE Equipment Matrix',
                'معدات الحماية الفردية الإلزامية (EPI)',
                'Matrice des Équipements de Protection (EPI)'
              )}
            </h4>
          </div>

          <div className="space-y-2.5">
            {/* Respirator */}
            <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border text-xs">
              <span className="font-semibold text-muted-foreground">
                🤿 {tr(language, 'Respiratory Protection', 'حماية الجهاز التنفسي', 'Protection Respiratoire')}
              </span>
              <Badge
                className={
                  chemical.mandatoryPpe.respirator.includes('A2P3')
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }
              >
                {chemical.mandatoryPpe.respirator.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Chemical Gloves */}
            <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border text-xs">
              <span className="font-semibold text-muted-foreground">
                🧤 {tr(language, 'Chemical Gloves', 'قفازات كيميائية معتمدة', 'Gants Chimiques')}
              </span>
              <Badge variant="outline" className="font-mono">
                {chemical.mandatoryPpe.gloves === 'butyl' ? 'Butyl Rubber (EN 374-3)' : 'Nitrile 400µm (EN 374)'}
              </Badge>
            </div>

            {/* Body Suit */}
            <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border text-xs">
              <span className="font-semibold text-muted-foreground">
                🥼 {tr(language, 'Protective Coverall', 'بدلة الرش الوقائية', 'Combinaison')}
              </span>
              <Badge variant="outline">
                {chemical.mandatoryPpe.bodySuit === 'type_4_liquid_tight'
                  ? 'Type 4 (Liquid-tight)'
                  : chemical.mandatoryPpe.bodySuit === 'type_6_spray'
                  ? 'Type 6 (Spray-tight)'
                  : 'Standard Coverall'}
              </Badge>
            </div>

            {/* Eye / Face Protection */}
            <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border text-xs">
              <span className="font-semibold text-muted-foreground">
                🥽 {tr(language, 'Eye / Face Shield', 'واقي العينين والوجه', 'Lunettes / Visière')}
              </span>
              <Badge variant="outline">
                {chemical.mandatoryPpe.eyeProtection.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Footwear */}
            <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border text-xs">
              <span className="font-semibold text-muted-foreground">
                🥾 {tr(language, 'Chemical Boots', 'أحذية كيميائية مانعة للانزلاق', 'Bottes Chimiques')}
              </span>
              <Badge variant="outline">
                {chemical.mandatoryPpe.footwear === 'nitrile_chemical_boots'
                  ? 'Nitrile S5 Chemical'
                  : 'Leather Boots'}
              </Badge>
            </div>
          </div>

          {/* Operator Health Hazards Warning */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 dark:border-rose-900/60 dark:bg-rose-950/20 text-xs space-y-1.5">
            <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              {tr(language, 'Human Health Hazard Warnings', 'تحذيرات المخاطر الصحية على الإنسان', 'Dangers pour la santé humaine')}
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
              {chemical.humanHealthHazards.map((hazard, idx) => (
                <li key={idx}>{hazard}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* COLUMN 2: REI & PHI INTERACTIVE HARVEST COUNTDOWN */}
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <h4 className="text-sm font-bold text-foreground">
              {tr(
                language,
                'Re-Entry (REI) & Harvest (PHI) Calculator',
                'حاسبة مهلة الدخول للحقل وجني المحصول',
                'Calculateur Délais Réentrée & Récolte'
              )}
            </h4>
          </div>

          {/* Date / Time Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">
                {tr(language, 'Spraying Date:', 'تاريخ الرش:', 'Date de pulvérisation :')}
              </label>
              <Input
                type="date"
                value={plannedSprayingDate}
                onChange={(e) => setPlannedSprayingDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">
                {tr(language, 'Spraying Time:', 'وقت الرش:', 'Heure de pulvérisation :')}
              </label>
              <Input
                type="time"
                value={plannedSprayingTime}
                onChange={(e) => setPlannedSprayingTime(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              {tr(language, 'Planned Harvest Date:', 'تاريخ الجني المستهدف:', 'Date de récolte prévue :')}
            </label>
            <Input
              type="date"
              value={plannedHarvestDate}
              onChange={(e) => setPlannedHarvestDate(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>

          {/* Result Cards */}
          <div className="space-y-3 pt-2">
            {/* Safe Re-Entry Milestone */}
            <div className="rounded-xl border border-border bg-card p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {tr(language, 'Safe Re-Entry Time (No PPE):', 'موعد الدخول الآمن للحقل:', 'Entrée sans EPI autorisée :')}
                </span>
                <Badge variant="outline" className="font-mono text-emerald-700">
                  +{chemical.reiHours}h
                </Badge>
              </div>
              <div className="text-sm font-black text-foreground">
                {timingCalculations.reiExpiry.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                at{' '}
                {timingCalculations.reiExpiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Harvest Compliance Verification */}
            <div
              className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                timingCalculations.isHarvestSafe
                  ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                  : 'border-rose-300 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {timingCalculations.isHarvestSafe ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600" />
                  )}
                  {timingCalculations.isHarvestSafe
                    ? tr(language, 'Harvest Authorized (Zero Residue Risk)', 'الجني مسموح قانونياً (لا خطر للترسبات)', 'Récolte Autorisée (LMR Conforme)')
                    : tr(language, 'VIOLATION: Harvest Forbidden (DAR Non-Compliant)', 'مخالفة: الجني ممنوع قبل انقضاء المهلة', 'INTERDIT : Délai DAR non respecté')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {timingCalculations.isHarvestSafe
                  ? tr(
                      language,
                      `Harvest is scheduled ${timingCalculations.harvestMarginDays} days AFTER the required ${chemical.phiDays}-day PHI milestone.`,
                      `الجني مبرمج بعد ${timingCalculations.harvestMarginDays} أيام من انتهاء مهلة الأمان المطلوبة (${chemical.phiDays} أيام).`,
                      `La récolte est prévue ${timingCalculations.harvestMarginDays} jours APRÈS le délai DAR légal de ${chemical.phiDays} jours.`
                    )
                  : tr(
                      language,
                      `CRITICAL: Wait at least ${Math.abs(timingCalculations.harvestMarginDays)} more days to avoid pesticide residue rejection (MRL / LMR).`,
                      `تنبيه حرج: يجب الانتظار ${Math.abs(timingCalculations.harvestMarginDays)} أيام إضافية لتفادي ترسبات المبيدات ورفض المحصول.`,
                      `ATTENTION : Attendre au moins ${Math.abs(timingCalculations.harvestMarginDays)} jours de plus pour respecter la LMR.`
                    )}
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 3: ENVIRONMENTAL ECOTOXICITY & WEATHER SPRAY AUDITOR */}
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-teal-600" />
            <h4 className="text-sm font-bold text-foreground">
              {tr(
                language,
                'Ecotoxicity & Meteorological Spray Auditor',
                'التأثير البيئي ومطابقة شروط الطقس للرش',
                'Écotoxicité & Conformité Météo Pulvérisation'
              )}
            </h4>
          </div>

          {/* Ecotoxicity Indices */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                <Bug className="h-3 w-3 text-amber-500" />
                {tr(language, 'Bee & Pollinators', 'النحل والحشرات النافعة', 'Abeilles & Pollinisateurs')}
              </span>
              <span
                className={`text-xs font-bold ${
                  chemical.beeToxicity === 'high'
                    ? 'text-rose-600'
                    : chemical.beeToxicity === 'moderate'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {chemical.beeToxicity.toUpperCase()}
              </span>
            </div>

            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                <Waves className="h-3 w-3 text-blue-500" />
                {tr(language, 'Aquatic Organisms', 'الكائنات المائية والأسماك', 'Organismes Aquatiques')}
              </span>
              <span className="text-xs font-bold text-blue-600">
                {chemical.aquaticToxicity.toUpperCase()}
              </span>
            </div>

            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-[10px] text-muted-foreground block">
                {tr(language, 'Soil Half-Life (DT50)', 'نصف عمر التحلل بالتربة', 'Persistance Sol (DT50)')}
              </span>
              <span className="text-xs font-bold text-foreground">
                {chemical.soilPersistenceHalfLifeDays} {tr(language, 'days', 'يوم', 'j')}
              </span>
            </div>

            <div className="rounded-xl bg-card p-2.5 border border-border">
              <span className="text-[10px] text-muted-foreground block">
                {tr(language, 'Leaching Index (Koc)', 'مؤشر التسرب للمياه', 'Lessivage (Koc)')}
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {chemical.leachingPotentialKoc} mL/g
              </span>
            </div>
          </div>

          {/* Interactive Weather Spraying Condition Auditor */}
          <div className="rounded-xl border border-border bg-card p-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-blue-600" />
                {tr(language, 'Spraying Weather Parameters', 'معايير طقس الرش الحالية', 'Conditions Météo Actuelles')}
              </span>
              <Badge
                className={
                  weatherAuditor.overallSafe
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }
              >
                {weatherAuditor.overallSafe ? 'Optimum Window' : 'High Drift / Loss Risk'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <span className="text-[10px] text-muted-foreground block">Vent (km/h)</span>
                <input
                  type="number"
                  value={currentWindKmh}
                  onChange={(e) => setCurrentWindKmh(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Temp (°C)</span>
                <input
                  type="number"
                  value={currentTempC}
                  onChange={(e) => setCurrentTempC(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Humidité (%)</span>
                <input
                  type="number"
                  value={currentHumidityPct}
                  onChange={(e) => setCurrentHumidityPct(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-bold"
                />
              </div>
            </div>

            {/* Delta T Evaluation */}
            <div className="flex items-center justify-between border-t border-border pt-1.5 text-[11px]">
              <span className="text-muted-foreground">
                Delta T = <strong className="text-foreground">{deltaT} °C</strong> (Idéal: 2 - 8°C)
              </span>
              <span
                className={`font-semibold ${
                  weatherAuditor.deltaTOk ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {weatherAuditor.deltaTOk ? '✓ Pas d’évaporation excessive' : '⚠ Risque de volatilisation'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
