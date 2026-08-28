'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, Droplets, Sprout, CloudRain, Sun, Snowflake, Cloud, ArrowRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Workflow } from '@/lib/workflows';
import { copyFor, useTranslation } from '@/lib/language-store';

interface SeasonSchedulerProps {
  onLaunchWorkflow?: (workflowId: string) => void;
}

type Hemisphere = 'northern' | 'southern';

interface SeasonInfo {
  name: string;
  icon: typeof Sun;
  color: string;
  bg: string;
  border: string;
  months: string;
  irrigationFocus: string;
  recommendations: { text: string; formulaCodes?: string[] }[];
  riskAlert?: string;
}

function getSeason(month: number, hemisphere: Hemisphere): SeasonInfo {
  // month is 0-indexed (0 = January)
  const seasons: Record<string, SeasonInfo> = {
    spring: {
      name: 'Spring',
      icon: Sprout,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      months: 'Mar–May (N) / Sep–Nov (S)',
      irrigationFocus: 'Crop establishment & early-season irrigation',
      recommendations: [
        { text: 'Calculate crop water requirements (ETc) for newly planted crops', formulaCodes: ['IRR-10.4'] },
        { text: 'Set up irrigation scheduling based on soil water and ET', formulaCodes: ['IRR-9.3'] },
        { text: 'Check system uniformity before the peak season', formulaCodes: ['IRR-7.3', 'IRR-8.1'] },
        { text: 'Plan fertilizer injection rates for fertigation', formulaCodes: ['IRR-13.2'] },
      ],
      riskAlert: 'Frost risk for early-planted crops — monitor minimum temperatures and have frost protection ready.',
    },
    summer: {
      name: 'Summer',
      icon: Sun,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      months: 'Jun–Aug (N) / Dec–Feb (S)',
      irrigationFocus: 'Peak water demand & heat stress management',
      recommendations: [
        { text: 'Peak ET — calculate gross irrigation requirement daily', formulaCodes: ['IRR-10.6'] },
        { text: 'Monitor THI for livestock heat stress', formulaCodes: ['37.1'] },
        { text: 'Check Distribution Uniformity — heat stresses emitters', formulaCodes: ['IRR-7.3'] },
        { text: 'Calculate leaching requirement if salinity is building up', formulaCodes: ['IRR-9.4'] },
      ],
      riskAlert: 'Peak water demand — ET can exceed 8 mm/day. Ensure pumps and filters can handle continuous operation.',
    },
    autumn: {
      name: 'Autumn',
      icon: CloudRain,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      months: 'Sep–Nov (N) / Mar–May (S)',
      irrigationFocus: 'Harvest preparation & system maintenance',
      recommendations: [
        { text: 'Reduce irrigation as crop matures — calculate final irrigation', formulaCodes: ['IRR-9.3'] },
        { text: 'Flush and inspect drip lines before winter storage', formulaCodes: ['IRR-7.3'] },
        { text: 'Test water quality before next season', formulaCodes: ['IRR-12.1'] },
        { text: 'Audit system performance for the season — calculate WUE', formulaCodes: ['6.4'] },
      ],
      riskAlert: 'Early rains can waterlog crops if irrigation is not stopped in time. Monitor weather forecasts.',
    },
    winter: {
      name: 'Winter',
      icon: Snowflake,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      border: 'border-cyan-200 dark:border-cyan-800',
      months: 'Dec–Feb (N) / Jun–Aug (S)',
      irrigationFocus: 'System maintenance & planning for next season',
      recommendations: [
        { text: 'Drain and winterize irrigation system to prevent freeze damage' },
        { text: 'Plan next season\'s system design — review pipe sizing', formulaCodes: ['IRR-15.6'] },
        { text: 'Review water availability and storage capacity', formulaCodes: ['IRR-14.1'] },
        { text: 'Analyze last season\'s performance data and benchmark', formulaCodes: ['6.4'] },
      ],
      riskAlert: 'Freeze damage risk — drain all pipes, pumps, and tanks. Store sensitive equipment indoors.',
    },
  };

  // Northern hemisphere seasons
  const northern: SeasonInfo[] = [
    seasons.winter, seasons.winter, // Jan, Feb
    seasons.spring, seasons.spring, seasons.spring, // Mar, Apr, May
    seasons.summer, seasons.summer, seasons.summer, // Jun, Jul, Aug
    seasons.autumn, seasons.autumn, seasons.autumn, // Sep, Oct, Nov
    seasons.winter, // Dec
  ];

  // Southern hemisphere (shift by 6 months)
  const southern: SeasonInfo[] = [
    seasons.summer, seasons.summer, // Jan, Feb
    seasons.autumn, seasons.autumn, seasons.autumn, // Mar, Apr, May
    seasons.winter, seasons.winter, seasons.winter, // Jun, Jul, Aug
    seasons.spring, seasons.spring, seasons.spring, // Sep, Oct, Nov
    seasons.summer, // Dec
  ];

  return hemisphere === 'northern' ? northern[month] : southern[month];
}

export function SeasonScheduler({ onLaunchWorkflow }: SeasonSchedulerProps = {}) {
  const [hemisphere, setHemisphere] = useState<Hemisphere>('northern');
  // Defer date computation to after mount to avoid SSR hydration mismatch
  // (server renders in UTC, client in user's timezone — they can differ by a day)
  const [now, setNow] = useState<Date | null>(null);
  const { isRTL, language } = useTranslation();

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Do not use a fake date for SSR: a placeholder can expose the wrong season
  // and operational guidance before the client has mounted. Render a neutral
  // loading state until the user's actual current date is available.
  if (!now) {
    return (
      <section
        aria-live="polite"
        className="mb-8 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-background to-amber-50/30 p-4 shadow-sm dark:border-amber-900/60 dark:to-amber-950/10 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <Calendar className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {copyFor(language, 'Seasonal Irrigation Planner', 'مخطّط الري الموسمي', 'Planificateur d’irrigation saisonnière')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {copyFor(
                language,
                'Preparing today’s date and seasonal guidance…',
                'جارٍ تجهيز تاريخ اليوم والتوجيهات الموسمية…',
                'Préparation de la date du jour et des recommandations saisonnières…'
              )}
            </p>
          </div>
        </div>
        <div aria-hidden="true" className="mt-4 h-2 animate-pulse rounded-full bg-amber-100 dark:bg-amber-900/40" />
      </section>
    );
  }

  const month = now.getMonth();
  const season = getSeason(month, hemisphere);
  const SeasonIcon = season.icon;

  const monthName = now.toLocaleString(isRTL ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' });
  const dayOfMonth = now.getDate();

  // Arabic overrides for season strings (name, focus, risk, recommendations)
  const seasonAr: Record<string, {
    name: string;
    irrigationFocus: string;
    riskAlert?: string;
    recommendations: string[];
  }> = {
    spring: {
      name: 'الربيع',
      irrigationFocus: 'تأسيس المحصول والري المبكر',
      riskAlert: 'خطر صقيع للمحاصيل المزروعة مبكراً — راقب أدنى درجات الحرارة وجهّز حماية الصقيع.',
      recommendations: [
        'احسب احتياج المحصول المائي (ETc) للمحاصيل المزروعة حديثاً',
        'أعدّ جدولة الري بناءً على ماء التربة و ET',
        'تحقّق من تجانس النظام قبل ذروة الموسم',
        'خطّط لمعدلات حقن السماد للتسميد بالري',
      ],
    },
    summer: {
      name: 'الصيف',
      irrigationFocus: 'ذروة الطلب المائي وإدارة الإجهاد الحراري',
      riskAlert: 'ذروة الطلب المائي — قد يتجاوز ET 8 مم/يوم. تأكّد أن المضخات والفلاتر تتحمّل التشغيل المستمر.',
      recommendations: [
        'ذروة ET — احسب الاحتياج الإجمالي للري يومياً',
        'راقب THI لإجهاد الماشية الحراري',
        'تحقّق من تجانس التوزيع — الحرارة تضغط على الرؤوس',
        'احسب متطلّب الغسل إذا تراكمت الملوحة',
      ],
    },
    autumn: {
      name: 'الخريف',
      irrigationFocus: 'تجهيز الحصاد وصيانة النظام',
      riskAlert: 'الأمطار المبكرة قد تغرق المحاصيل إذا لم يُوقف الري في الوقت. راقب توقعات الطقس.',
      recommendations: [
        'قلّل الري نضج المحصول — احسب الري النهائي',
        'اغسل وفحص خطوط التنقيط قبل التخزين الشتوي',
        'اختبر جودة المياه قبل الموسم القادم',
        'دقّق أداء النظام للموسم — احسب WUE',
      ],
    },
    winter: {
      name: 'الشتاء',
      irrigationFocus: 'صيانة النظام وتخطيط الموسم القادم',
      riskAlert: 'خطر تلف التجمّد — فرّغ كل الأنابيب والمضخات والخزّانات. خزّن المعدات الحساسة داخل البيوت.',
      recommendations: [
        'فرّغ وأصلح نظام الري لمنع تلف التجمّد',
        'خطّط لتصميم نظام الموسم القادم — راجع حجم الأنابيب',
        'راجع توفّر المياه وسعة التخزين',
        'حلّل بيانات أداء الموسم الماضي وقارن',
      ],
    },
  };

  const seasonKey = season.name.toLowerCase();
  const ar = isRTL ? seasonAr[seasonKey] : null;
  const localizedName = isRTL && ar ? ar.name : season.name;
  const localizedFocus = isRTL && ar ? ar.irrigationFocus : season.irrigationFocus;
  const localizedRisk = isRTL && ar && ar.riskAlert ? ar.riskAlert : season.riskAlert;
  const localizedRecs = isRTL && ar ? ar.recommendations : season.recommendations.map(r => r.text);
  const localizedMonths = isRTL ? {
    spring: 'مارس–مايو (شمال) / سبتمبر–نوفمبر (جنوب)',
    summer: 'يونيو–أغسطس (شمال) / ديسمبر–فبراير (جنوب)',
    autumn: 'سبتمبر–نوفمبر (شمال) / مارس–مايو (جنوب)',
    winter: 'ديسمبر–فبراير (شمال) / يونيو–أغسطس (جنوب)',
  }[seasonKey] : season.months;

  return (
    <section className="mb-8 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-background to-amber-50/30 p-4 shadow-sm dark:border-amber-900/60 dark:to-amber-950/10 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Calendar className="h-4 w-4" /></span>
            <h2 className="text-lg font-semibold tracking-tight">{copyFor(language, 'Seasonal Irrigation Planner', 'مخطّط الري الموسمي')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRTL ? `اليوم ${dayOfMonth} ${monthName}. إليك ما يجب التركيز عليه هذا الموسم.` : `Today is ${monthName} ${dayOfMonth}. Here's what to focus on this season.`}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background/70 p-1">
          <MapPin className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setHemisphere('northern')}
            className={cn(
              'min-h-9 rounded-md border px-3 py-1 text-[10px] font-medium transition-all',
              hemisphere === 'northern'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border'
            )}
          >
            {copyFor(language, 'Northern', 'شمالي')}
          </button>
          <button
            onClick={() => setHemisphere('southern')}
            className={cn(
              'min-h-9 rounded-md border px-3 py-1 text-[10px] font-medium transition-all',
              hemisphere === 'southern'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border'
            )}
          >
            {copyFor(language, 'Southern', 'جنوبي')}
          </button>
        </div>
      </div>

      <div className={cn('rounded-2xl border-2 p-4 sm:p-5', season.border, season.bg)}>
        {/* Season header */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-current/10', season.bg, season.color)}>
            <SeasonIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn('text-xl font-bold', season.color)}>{localizedName}</h3>
              <Badge variant="outline" className="text-[10px] font-normal">
                {localizedMonths}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {localizedFocus}
            </p>
          </div>
        </div>

        {/* Risk alert */}
        {localizedRisk && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="text-amber-600 dark:text-amber-400 text-sm">⚠</span>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {localizedRisk}
            </p>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-2">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copyFor(language, "This Season's Priorities", 'أولويات هذا الموسم')}
          </div>
          {season.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/70 p-3 transition-colors hover:border-emerald-300 dark:hover:border-emerald-800"
            >
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', season.bg, season.color)}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">{localizedRecs[idx] ?? rec.text}</p>
                {rec.formulaCodes && rec.formulaCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {rec.formulaCodes.map(code => (
                      <Badge key={code} variant="outline" className="text-[9px] font-mono font-semibold">
                        {code}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick action */}
        <div className="mt-5 border-t border-border/50 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 text-xs"
            onClick={() => {
              // Launch the most relevant workflow for the season
              const workflowMap: Record<string, string> = {
                spring: 'design-drip-system',
                summer: 'audit-irrigation-system',
                autumn: 'audit-irrigation-system',
                winter: 'design-drip-system',
              };
              // This would need the workflows passed in — for now just show a message
            }}
          >
            <Droplets className="h-3.5 w-3.5" />
            {isRTL ? `ابدأ سير عمل ${localizedName}` : `Start ${season.name} Workflow`}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}
