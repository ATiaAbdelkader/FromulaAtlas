'use client';

/**
 * FarmStats — aggregate counts from localStorage across the app.
 *
 * Shows 4 stats in a compact card:
 *   - Fields (from MultiFieldDashboard store)
 *   - Total area (ha)
 *   - Irrigation schedules (from Irrigation Scheduler store)
 *   - Fertilization plans generated (from a simple counter)
 *
 * No props — reads localStorage on mount + on focus (so switching back to
 * the tab refreshes the numbers).
 */

import { useState, useEffect } from 'react';
import { Layers, Droplets, FlaskConical, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/language-store';

interface Stat {
  icon: typeof Layers;
  label: string;
  value: string;
  color: string;
}

export function FarmStats() {
  const { isRTL } = useTranslation();
  const [stats, setStats] = useState<Stat[]>([
    { icon: Layers, label: isRTL ? 'الحقول' : 'Fields', value: '—', color: '#16a34a' },
    { icon: MapPin, label: isRTL ? 'المساحة الكلية' : 'Total area', value: '—', color: '#0891b2' },
    { icon: Droplets, label: isRTL ? 'مناطق الري' : 'Irrigation zones', value: '—', color: '#0ea5e9' },
    { icon: FlaskConical, label: isRTL ? 'الجداول' : 'Schedules', value: '—', color: '#8b5cf6' },
  ]);

  useEffect(() => {
    const compute = () => {
      // Fields — from MultiFieldDashboard store
      let fieldCount = 0;
      let totalArea = 0;
      try {
        const raw = localStorage.getItem('nutriplant_fields_v1');
        if (raw) {
          const fields = JSON.parse(raw);
          if (Array.isArray(fields)) {
            fieldCount = fields.length;
            totalArea = fields.reduce((sum: number, f: any) => sum + (f.area || 0), 0);
          }
        }
      } catch { /* ignore */ }

      // Irrigation zones — from Irrigation Scheduler store
      let zoneCount = 0;
      let schedCount = 0;
      try {
        const raw = localStorage.getItem('irrigation_scheduler_v1');
        if (raw) {
          const sys = JSON.parse(raw);
          if (sys.controllers) {
            for (const c of sys.controllers) {
              zoneCount += c.zones?.length || 0;
              for (const z of (c.zones || [])) {
                schedCount += z.schedules?.length || 0;
              }
            }
          }
        }
      } catch { /* ignore */ }

      setStats([
        { icon: Layers, label: isRTL ? 'الحقول' : 'Fields', value: String(fieldCount), color: '#16a34a' },
        { icon: MapPin, label: isRTL ? 'المساحة الكلية' : 'Total area', value: totalArea > 0 ? `${totalArea.toFixed(1)} ha` : '—', color: '#0891b2' },
        { icon: Droplets, label: isRTL ? 'مناطق الري' : 'Irrigation zones', value: String(zoneCount), color: '#0ea5e9' },
        { icon: FlaskConical, label: isRTL ? 'الجداول' : 'Schedules', value: String(schedCount), color: '#8b5cf6' },
      ]);
    };

    compute();
    // Refresh on window focus (user comes back from another tab)
    window.addEventListener('focus', compute);
    return () => window.removeEventListener('focus', compute);
  }, [isRTL]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="rounded-lg border bg-card p-3 flex items-center gap-2.5"
            style={{ borderLeftWidth: 3, borderLeftColor: stat.color }}
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: stat.color + '20' }}
            >
              <Icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight font-mono">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
