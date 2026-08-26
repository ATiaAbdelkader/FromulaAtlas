'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Droplets,
  TrendingUp,
  Flame,
  Zap,
  Info,
  CalendarCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import { formatSimulatorDzd } from '@/lib/crop-simulator';

export interface AgronomicVerdictBannerProps {
  cropName: string;
  cropEmoji: string;
  areaHa: number;
  grossMarginDzd: number;
  totalWaterM3: number;
  irrigationSystem: string;
  isDeficitActive?: boolean;
  hasPhytoProtections?: boolean;
  avgET0?: number;
  className?: string;
}

export function AgronomicVerdictBanner({
  cropName,
  cropEmoji,
  areaHa,
  grossMarginDzd,
  totalWaterM3,
  irrigationSystem,
  isDeficitActive = false,
  hasPhytoProtections = true,
  avgET0 = 5.0,
  className = '',
}: AgronomicVerdictBannerProps) {
  const { language } = useTranslation();
  const tr = copyFor;

  const isProfitable = grossMarginDzd > 0;
  const isHighHeatZone = avgET0 > 5.5;

  const alerts = useMemo(() => {
    const list: {
      type: 'success' | 'warning' | 'info' | 'critical';
      title: string;
      message: string;
      icon: typeof CheckCircle2;
    }[] = [];

    // Financial & Economic Verdict
    if (isProfitable) {
      list.push({
        type: 'success',
        title: tr(language, 'High Economic Viability', 'جدوى اقتصادية ممتازة', 'Forte viabilité économique'),
        message: tr(
          language,
          `Projected gross margin is ${formatSimulatorDzd(grossMarginDzd)} (${formatSimulatorDzd(Math.round(grossMarginDzd / Math.max(0.1, areaHa)))} / ha), confirming sustainable operational profitability.`,
          `هامش الربح الإجمالي المتوقع هو ${formatSimulatorDzd(grossMarginDzd)} (${formatSimulatorDzd(Math.round(grossMarginDzd / Math.max(0.1, areaHa)))} / هكتار)، ما يؤكد الجدوى الاقتصادية الممتازة.`,
          `Marge brute prévisionnelle de ${formatSimulatorDzd(grossMarginDzd)} (${formatSimulatorDzd(Math.round(grossMarginDzd / Math.max(0.1, areaHa)))} / ha), confirmant la rentabilité d'exploitation.`
        ),
        icon: CheckCircle2,
      });
    } else {
      list.push({
        type: 'critical',
        title: tr(language, 'Deficit Margin Warning', 'تحذير: هامش ربح سلبي', 'Alerte marge déficitaire'),
        message: tr(
          language,
          `Current operational costs exceed projected revenue. Re-evaluate input prices, target yield, or field density.`,
          `المصاريف التشغيلية تفوق الإيرادات المتوقعة. يرجى مراجعة تكلفة المدخلات، المردود المستهدف، أو كثافة الغرس.`,
          `Les charges opérationnelles dépassent le chiffre d’affaires prévisionnel. Ajustez vos coûts d’intrants ou le rendement cible.`
        ),
        icon: AlertTriangle,
      });
    }

    // Hydric & Evaporative Stress Verdict
    if (isHighHeatZone && irrigationSystem === 'rainfed') {
      list.push({
        type: 'critical',
        title: tr(language, 'Severe Arid Drought Risk', 'خطر جفاف حاد في المناطق الحارة', 'Risque majeur de stress hydrique aride'),
        message: tr(
          language,
          `With reference ET₀ of ${avgET0} mm/day under rainfed management, peak grain/fruit development risks terminal abortion without supplemental watering.`,
          `مع متبخر-نتح مرجعي ${avgET0} مم/يوم ونظام مطري، تتعرض مراحل الإزهار وتعبئة الثمار لخطر الإجهاض بدون ري تكميلي.`,
          `Avec une ET₀ de ${avgET0} mm/j en régime pluvial, les phases de floraison et nouaison risquent l'avortement sans irrigation de complément.`
        ),
        icon: Flame,
      });
    } else if (isDeficitActive) {
      list.push({
        type: 'warning',
        title: tr(language, 'Regulated Deficit Active (RDI)', 'نظام الري الناقص المقنن مفعل (RDI)', 'Déficit hydrique régulé actif (RDI)'),
        message: tr(
          language,
          `Water savings applied during vegetative growth. Ensure 100% full replenishment resumes during critical flowering and grain-filling windows.`,
          `تم توفير المياه في النمو الخضري. احرص على استئناف الري بنسبة 100% خلال فترات التزهير وتعبئة الثمار/الحبوب الحساسة.`,
          `Économie d’eau en phase végétative. Veillez à rétablir 100 % de l'ETc lors de la floraison et du remplissage.`
        ),
        icon: Droplets,
      });
    } else {
      list.push({
        type: 'info',
        title: tr(language, 'Water Security Confirmed', 'أمان الإمداد المائي مؤكد', 'Sécurité hydrique assurée'),
        message: tr(
          language,
          `Seasonal volume of ${totalWaterM3.toLocaleString()} m³ satisfies full FAO-56 requirements with ${irrigationSystem.toUpperCase()} distribution.`,
          `الحجم الموسمي المقدر بـ ${totalWaterM3.toLocaleString()} م³ يغطي احتياج FAO-56 بالكامل بنظام الري ${irrigationSystem.toUpperCase()}.`,
          `Le volume saisonnier de ${totalWaterM3.toLocaleString()} m³ couvre l’intégralité des besoins FAO-56 sous ${irrigationSystem.toUpperCase()}.`
        ),
        icon: ShieldCheck,
      });
    }

    return list;
  }, [grossMarginDzd, areaHa, isProfitable, isHighHeatZone, irrigationSystem, avgET0, isDeficitActive, totalWaterM3, language]);

  return (
    <div
      id="agronomic-action-verdict"
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="flex flex-col justify-between gap-3 border-b border-border/80 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                {tr(language, 'Expert Agronomic Verdict & Action Advisory', 'الحكم الزراعي الاستشاري وتوصيات التدخل', 'Verdict agronomique expert & Conseils d’action')}
              </span>
              <Badge className={isProfitable ? 'bg-emerald-600 text-white text-[10px]' : 'bg-rose-600 text-white text-[10px]'}>
                {isProfitable ? tr(language, 'Viable', 'مشروع رابح', 'Viable') : tr(language, 'Attention Needed', 'تنبيه تدقيق', 'Attention')}
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-foreground sm:text-base">
              {cropEmoji} {cropName} · {areaHa} ha {tr(language, 'Field Diagnosis', 'تشخيص الحقل', 'Diagnostic Parcellaire')}
            </h3>
          </div>
        </div>
      </div>

      {/* Grid of Verdict Alerts */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {alerts.map((alert, idx) => {
          const Icon = alert.icon;
          const bgStyles = {
            success: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100',
            warning: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100',
            critical: 'border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100',
            info: 'border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100',
          }[alert.type];

          const iconStyles = {
            success: 'text-emerald-600 dark:text-emerald-400',
            warning: 'text-amber-600 dark:text-amber-400',
            critical: 'text-rose-600 dark:text-rose-400',
            info: 'text-blue-600 dark:text-blue-400',
          }[alert.type];

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-xl border p-3 text-xs transition-all ${bgStyles}`}
            >
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconStyles}`} />
              <div className="space-y-1">
                <div className="font-bold text-foreground">{alert.title}</div>
                <p className="leading-5 opacity-90">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
