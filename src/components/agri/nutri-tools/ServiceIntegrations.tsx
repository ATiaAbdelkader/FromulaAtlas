'use client';

/**
 * Service Integrations — settings panel for plugging in third-party free-tier
 * services that enhance the app once the user (or operator) adds API keys.
 *
 * Each integration:
 *   - Documents what it does and the free-tier limits (from free-for.dev)
 *   - Has a single input field for the key/URL
 *   - Saves to localStorage with the key `integration_<id>_v1`
 *   - Shows a "ready" badge when a key is present
 *   - Exports a `.env.local` snippet to copy-paste into Next.js env vars
 *
 * This is intentionally UI-only. The actual integrations (Clerk auth, OneSignal
 * push, MapTiler map tiles, Neon Postgres connection string, Supabase URL)
 * would be wired in follow-up PRs by reading these values from `process.env`
 * (server-side) or from a `/api/integrations` endpoint that injects them.
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings, Key, CheckCircle2, Copy, Check, ExternalLink,
  Database, Bell, Map as MapIcon, Lock, Cloud, Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/lib/language-store';

interface Integration {
  id: string;
  name: string;
  description: string;
  /** The free-tier summary — short, with concrete numbers. */
  freeTier: string;
  /** What gets unlocked in the app once enabled. */
  unlocks: string;
  /** The env var name (Next.js convention). */
  envVar: string;
  /** The localStorage key. */
  storageKey: string;
  /** Input placeholder — usually a hint at the format. */
  placeholder: string;
  /** Type of input — affects masking + URL vs key. */
  type: 'key' | 'url' | 'connstr';
  /** Optional URL for the service's sign-up page. */
  signupUrl?: string;
  icon: typeof Database;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'clerk',
    name: 'Clerk — User authentication',
    description: 'Drop-in React components for email + Google + 2FA sign-in. Eliminates the need to build auth flows.',
    freeTier: '50,000 monthly active users (MAU) per app — free forever, no credit card required.',
    unlocks: 'Cloud sync of fields, calculators, and reports across devices. Multi-farm accounts.',
    envVar: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    storageKey: 'integration_clerk_v1',
    placeholder: 'pk_test_…',
    type: 'key',
    signupUrl: 'https://clerk.com',
    icon: Lock,
    color: '#6d28d9',
  },
  {
    id: 'neon',
    name: 'Neon — Serverless PostgreSQL',
    description: 'Branchable Postgres — perfect for our Prisma schema. DB branches let us test migrations on a copy.',
    freeTier: '0.5 GB storage, 100 projects, 10 branches each, 20 hrs/mo of branch compute. Free forever.',
    unlocks: 'Persistent storage beyond localStorage. Real multi-device sync via authenticated API routes.',
    envVar: 'DATABASE_URL',
    storageKey: 'integration_neon_v1',
    placeholder: 'postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require',
    type: 'connstr',
    signupUrl: 'https://neon.tech',
    icon: Database,
    color: '#00e599',
  },
  {
    id: 'supabase',
    name: 'Supabase — All-in-one Postgres + Auth + Storage',
    description: 'Alternative to Clerk + Neon combined. Postgres DB, Auth, Storage, Realtime, Edge Functions.',
    freeTier: '500 MB DB, 50K MAU auth, 1 GB storage, 2 GB bandwidth. Free for 1 project, pauses after 7 days inactivity.',
    unlocks: 'Single integration for auth + DB + file storage (scouting photos, PDF reports).',
    envVar: 'NEXT_PUBLIC_SUPABASE_URL',
    storageKey: 'integration_supabase_v1',
    placeholder: 'https://xxxxx.supabase.co',
    type: 'url',
    signupUrl: 'https://supabase.com',
    icon: Cloud,
    color: '#3ecf8e',
  },
  {
    id: 'onesignal',
    name: 'OneSignal — Push notifications',
    description: 'Frost alerts, irrigation reminders, scouting todos — push to web + iOS + Android.',
    freeTier: 'Unlimited push notifications. 10,000 email sends per month. Unlimited contacts.',
    unlocks: 'Push alerts from WeatherRadar (frost/heat warnings) + irrigation scheduler + scouting todos.',
    envVar: 'NEXT_PUBLIC_ONESIGNAL_APP_ID',
    storageKey: 'integration_onesignal_v1',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    type: 'key',
    signupUrl: 'https://onesignal.com',
    icon: Bell,
    color: '#e54b4d',
  },
  {
    id: 'maptiler',
    name: 'MapTiler — Vector map tiles',
    description: 'Real slippy maps for the Field Boundary Importer (#2) — replaces static SVG preview.',
    freeTier: 'Free vector tiles + 4 map styles, weekly updates. 100K tile loads/mo free for non-commercial.',
    unlocks: 'Interactive maps in Field Boundary Importer. Real satellite imagery basemap for scouting.',
    envVar: 'NEXT_PUBLIC_MAPTILER_KEY',
    storageKey: 'integration_maptiler_v1',
    placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    type: 'key',
    signupUrl: 'https://www.maptiler.com',
    icon: MapIcon,
    color: '#3b82f6',
  },
  {
    id: 'gemini',
    name: 'Google Gemini API — Free-tier LLM',
    description: 'Generous free tier for AI: chat completions + vision (analyze scouting photos).',
    freeTier: '15 req/min, 1,500 req/day, 1M tokens/min — free. No credit card for first 90 days.',
    unlocks: 'Unlimited "ask the agronomist" responses. Photo-based pest/disease identification in Scouting Log.',
    envVar: 'GOOGLE_GEMINI_API_KEY',
    storageKey: 'integration_gemini_v1',
    placeholder: 'AIza…',
    type: 'key',
    signupUrl: 'https://ai.google.dev',
    icon: Sparkles,
    color: '#4285f4',
  },
];

const LS_KEYS = INTEGRATIONS.map(i => i.storageKey);

export function ServiceIntegrations() {
  const { isRTL } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEnv, setShowEnv] = useState(false);

  // Load from localStorage on mount.
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const i of INTEGRATIONS) {
      const v = localStorage.getItem(i.storageKey);
      if (v) next[i.id] = v;
    }
    setValues(next);
  }, []);

  const setValue = (id: string, value: string) => {
    const int = INTEGRATIONS.find(i => i.id === id);
    if (!int) return;
    const next = { ...values, [id]: value };
    setValues(next);
    if (value.trim()) {
      localStorage.setItem(int.storageKey, value.trim());
    } else {
      localStorage.removeItem(int.storageKey);
    }
  };

  const readyCount = useMemo(() => Object.values(values).filter(v => v && v.trim()).length, [values]);

  const envSnippet = useMemo(() => {
    const lines = [
      '# .env.local — paste these into your Next.js project root',
      '# Generated by Service Integrations panel',
      '',
    ];
    for (const i of INTEGRATIONS) {
      const v = values[i.id]?.trim();
      lines.push(`# ${i.name}`);
      lines.push(`${i.envVar}=${v || `<your_${i.id}_here>`}`);
      lines.push('');
    }
    return lines.join('\n');
  }, [values]);

  const copyEnv = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedId('env');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-600" /> {isRTL ? 'تكاملات الخدمات' : 'Service Integrations'}
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={readyCount > 0 ? 'default' : 'outline'} className="text-[10px]">
            {readyCount}/{INTEGRATIONS.length} {isRTL ? 'جاهز' : 'ready'}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{isRTL ? 'كل الخدمات لها خطط مجانية — لا حاجة لبطاقة ائتمان للبدء.' : 'All services have free tiers — no credit card required to start.'}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Each integration */}
        <div className="space-y-2">
          {INTEGRATIONS.map(i => (
            <IntegrationRow
              key={i.id}
              integration={i}
              value={values[i.id] || ''}
              onChange={v => setValue(i.id, v)}
              copied={copiedId === i.id}
              isRTL={isRTL}
              onCopy={() => {
                navigator.clipboard.writeText(values[i.id] || '');
                setCopiedId(i.id);
                setTimeout(() => setCopiedId(null), 2000);
              }}
            />
          ))}
        </div>

        {/* .env.local exporter */}
        <div className="pt-2 border-t">
          <Button
            size="sm" variant="outline"
            onClick={() => setShowEnv(s => !s)}
            className="gap-1.5 text-xs w-full"
          >
            <Key className="h-3.5 w-3.5" />
            {isRTL
              ? `${showEnv ? 'إخفاء' : 'إظهار'} تصدير .env.local (${readyCount} ${isRTL ? 'مفاتيح مضبوطة' : 'keys set'})`
              : `${showEnv ? 'Hide' : 'Show'} .env.local export (${readyCount} keys set)`}
          </Button>
          {showEnv && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={envSnippet}
                readOnly
                className="text-[10px] font-mono min-h-[260px] bg-muted/30"
              />
              <Button size="sm" onClick={copyEnv} className="gap-1.5 text-xs w-full">
                {copiedId === 'env' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {isRTL ? 'نسخ .env.local إلى الحافظة' : 'Copy .env.local to clipboard'}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                {isRTL
                  ? '💡 المفاتيح المُدخلة هنا تُخزَّن في localStorage متصفّحك (لكل جهاز). للنشر الإنتاجي، الصق المقتطف أعلاه في متغيّرات البيئة لدى مزوّد الاستضافة.'
                  : '💡 Keys entered here are stored in your browser\'s localStorage (per-device). To deploy to production, paste the snippet above into your hosting provider\'s environment variables.'}
              </p>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-2 text-[10px] text-muted-foreground">
          <strong className="text-slate-700 dark:text-slate-300">{isRTL ? 'الخصوصية:' : 'Privacy:'}</strong> {isRTL
            ? 'المفاتيح لا تغادر متصفّحك حتى تنشر. تُرسَل فقط إلى نقطة API للخدمة المقابلة عند استخدام التكامل فعلياً في التطبيق. تكامل Open-Meteo للطقس في متعقّب ET أعلاه لا يحتاج مفتاحاً — إنه مجاني فعلاً.'
            : 'Keys never leave your browser until you deploy. They are only sent to the corresponding service\'s API endpoint when that integration is actually used in the app. The Open-Meteo weather integration in the ET Tracker above needs no key — it\'s genuinely free.'}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Row component
// ============================================================================

function IntegrationRow({
  integration: i, value, onChange, copied, onCopy, isRTL,
}: {
  integration: Integration;
  value: string;
  onChange: (v: string) => void;
  copied: boolean;
  onCopy: () => void;
  isRTL: boolean;
}) {
  const ready = value.trim().length > 0;
  const masked = i.type !== 'url' && value && !copied;
    // No actual masking here — keep simple. The point is the user can copy.

  const Icon = i.icon;
  return (
    <div className={`rounded-md border p-2.5 transition-colors ${ready ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-border bg-background'}`}>
      <div className="flex items-start gap-2">
        <div
          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: i.color + '20', color: i.color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-xs">{i.name}</span>
            {ready ? (
              <Badge variant="default" className="text-[9px] bg-emerald-600">
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {isRTL ? 'جاهز' : 'Ready'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px]">{isRTL ? 'غير مُعدّ' : 'Not configured'}</Badge>
            )}
            {i.signupUrl && (
              <a
                href={i.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
              >
                {isRTL ? 'سجّل' : 'Sign up'} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{i.description}</p>
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            <div><span className="text-muted-foreground">{isRTL ? 'الخطة المجانية:' : 'Free tier:'}</span> {i.freeTier}</div>
            <div><span className="text-muted-foreground">{isRTL ? 'يفتح:' : 'Unlocks:'}</span> {i.unlocks}</div>
          </div>
          <div className="mt-2 flex gap-1.5 items-center">
            <Input
              type={i.type === 'connstr' ? 'text' : i.type === 'key' ? 'password' : 'text'}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={i.placeholder}
              className="h-7 text-[10px] font-mono flex-1"
            />
            {ready && (
              <Button size="sm" variant="ghost" onClick={onCopy} className="h-7 px-2">
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            )}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">env: {i.envVar}</div>
        </div>
      </div>
    </div>
  );
}
