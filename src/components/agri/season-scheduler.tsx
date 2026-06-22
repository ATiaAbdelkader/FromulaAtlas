'use client';

import { useState, useMemo } from 'react';
import { Calendar, Droplets, Sprout, CloudRain, Sun, Snowflake, Cloud, ArrowRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Workflow } from '@/lib/workflows';

interface SeasonSchedulerProps {
  onLaunchWorkflow?: (workflow: Workflow) => void;
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

export function SeasonScheduler({ onLaunchWorkflow }: SeasonSchedulerProps) {
  const [hemisphere, setHemisphere] = useState<Hemisphere>('northern');
  const now = new Date();
  const month = now.getMonth();

  const season = getSeason(month, hemisphere);
  const SeasonIcon = season.icon;

  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const dayOfMonth = now.getDate();

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <h2 className="text-lg font-semibold tracking-tight">Seasonal Irrigation Planner</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Today is {monthName} {dayOfMonth}. Here&apos;s what to focus on this season.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setHemisphere('northern')}
            className={cn(
              'px-2 py-1 rounded-md text-[10px] font-medium transition-all border',
              hemisphere === 'northern'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border'
            )}
          >
            Northern
          </button>
          <button
            onClick={() => setHemisphere('southern')}
            className={cn(
              'px-2 py-1 rounded-md text-[10px] font-medium transition-all border',
              hemisphere === 'southern'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border'
            )}
          >
            Southern
          </button>
        </div>
      </div>

      <div className={cn('rounded-xl border-2 p-5', season.border, season.bg)}>
        {/* Season header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('flex items-center justify-center h-12 w-12 rounded-lg', season.bg, season.color)}>
            <SeasonIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={cn('text-xl font-bold', season.color)}>{season.name}</h3>
              <Badge variant="outline" className="text-[10px] font-normal">
                {season.months}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {season.irrigationFocus}
            </p>
          </div>
        </div>

        {/* Risk alert */}
        {season.riskAlert && (
          <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-sm">⚠</span>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {season.riskAlert}
            </p>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
            This Season&apos;s Priorities
          </div>
          {season.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-background/60 border border-border/50 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
            >
              <div className={cn('flex items-center justify-center h-6 w-6 rounded-full flex-shrink-0 text-[10px] font-bold', season.bg, season.color)}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">{rec.text}</p>
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
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
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
            Start {season.name} Workflow
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}
