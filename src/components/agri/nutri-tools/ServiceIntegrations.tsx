'use client';

/**
 * Service Integrations — settings panel for plugging in third-party free-tier
 * services that enhance the app once the user (or operator) adds API keys.
 *
 * Wrapped in CalculatorShell (violet accent, Settings icon) so it visually
 * matches the rest of the Farm-tab tools. Each integration:
 *   - Documents what it does and the free-tier limits (from free-for.dev)
 *   - Has a single input field for the key/URL
 *   - Saves to localStorage with the key `integration_<id>_v1`
 *   - Shows a "ready" badge when a key is present
 *   - Exports a `.env.local` snippet to copy-paste into Next.js env vars
 */

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings, Key, CheckCircle2, Copy, Check, ExternalLink,
  Database, Bell, Map as MapIcon, Lock, Cloud, Sparkles, RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Service Integrations',
  ar: 'تكاملات الخدمات',
  fr: 'Intégrations de Services',
};

const DESC: TrilingualString = {
  en: 'Plug-in free-tier services (Clerk, Neon, Supabase, OneSignal, MapTiler, Gemini) — all have free plans, no credit card required to start.',
  ar: 'اربط خدمات مجانية (Clerk، Neon، Supabase، OneSignal، MapTiler، Gemini) — جميعها بخطط مجانية وبدون بطاقة ائتمان للبدء.',
  fr: 'Branchez des services gratuits (Clerk, Neon, Supabase, OneSignal, MapTiler, Gemini) — tous avec un plan gratuit, sans carte bancaire.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Keys never leave your browser until you deploy. They are only sent to the corresponding service API endpoint when that integration is actually used. The Open-Meteo weather integration needs no key — it is genuinely free.',
  ar: 'المفاتيح لا تغادر متصفّحك حتى تنشر. تُرسَل فقط إلى نقطة API للخدمة المقابلة عند استخدام التكامل فعلياً. تكامل Open-Meteo للطقس لا يحتاج مفتاحاً — إنه مجاني فعلاً.',
  fr: 'Les clés ne quittent jamais votre navigateur avant le déploiement. Elles ne sont envoyées qu’au point d’API du service correspondant lors de l’utilisation réelle. L’intégration Open-Meteo ne nécessite aucune clé — réellement gratuite.',
};

interface Integration {
  id: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  /** The free-tier summary — short, with concrete numbers. */
  freeTier: string;
  freeTier_ar?: string;
  /** What gets unlocked in the app once enabled. */
  unlocks: string;
  unlocks_ar?: string;
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
    name_ar: 'Clerk — مصادقة المستخدم',
    description: 'Drop-in React components for email + Google + 2FA sign-in. Eliminates the need to build auth flows.',
    description_ar: 'مكوّنات React جاهزة لتسجيل الدخول بالبريد + Google + 2FA. يلغي الحاجة لبناء تدفقات المصادقة.',
    freeTier: '50,000 monthly active users (MAU) per app — free forever, no credit card required.',
    freeTier_ar: '50,000 مستخدم نشط شهرياً لكل تطبيق — مجاني للأبد، بدون بطاقة ائتمان.',
    unlocks: 'Cloud sync of fields, calculators, and reports across devices. Multi-farm accounts.',
    unlocks_ar: 'مزامنة سحابية للحقول والحاسبات والتقارير عبر الأجهزة. حسابات متعددة المزارع.',
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
    name_ar: 'Neon — PostgreSQL بدون خادم',
    description: 'Branchable Postgres — perfect for our Prisma schema. DB branches let us test migrations on a copy.',
    description_ar: 'Postgres قابل للتفرّع — مثالي لمخطط Prisma لدينا. فروع قاعدة البيانات تتيح اختبار الهجرات على نسخة.',
    freeTier: '0.5 GB storage, 100 projects, 10 branches each, 20 hrs/mo of branch compute. Free forever.',
    freeTier_ar: '0.5 غيغابايت تخزين، 100 مشروع، 10 فروع لكل منها، 20 ساعة/شهر من حوسبة الفروع. مجاني للأبد.',
    unlocks: 'Persistent storage beyond localStorage. Real multi-device sync via authenticated API routes.',
    unlocks_ar: 'تخزين دائم بعد localStorage. مزامنة حقيقية متعددة الأجهزة عبر مسارات API المُصدّق عليها.',
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
    name_ar: 'Supabase — Postgres + مصادقة + تخزين في واحد',
    description: 'Alternative to Clerk + Neon combined. Postgres DB, Auth, Storage, Realtime, Edge Functions.',
    description_ar: 'بديل لـ Clerk + Neon معاً. قاعدة Postgres، مصادقة، تخزين، Realtime، دوال Edge.',
    freeTier: '500 MB DB, 50K MAU auth, 1 GB storage, 2 GB bandwidth. Free for 1 project, pauses after 7 days inactivity.',
    freeTier_ar: '500 م.ب قاعدة بيانات، 50 ألف مستخدم نشط مصادقة، 1 غيغابايت تخزين، 2 غيغابايت نطاق ترددي. مجاني لمشروع واحد، يتوقّف بعد 7 أيام خمول.',
    unlocks: 'Single integration for auth + DB + file storage (scouting photos, PDF reports).',
    unlocks_ar: 'تكامل واحد للمصادقة + قاعدة البيانات + تخزين الملفات (صور الكشف، تقارير PDF).',
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
    name_ar: 'OneSignal — إشعارات الدفع',
    description: 'Frost alerts, irrigation reminders, scouting todos — push to web + iOS + Android.',
    description_ar: 'تنبيهات الصقيع، تذكيرات الري، مهام الكشف — دفع إلى الويب + iOS + Android.',
    freeTier: 'Unlimited push notifications. 10,000 email sends per month. Unlimited contacts.',
    freeTier_ar: 'إشعارات دفع غير محدودة. 10,000 رسالة بريد إلكتروني شهرياً. جهات اتصال غير محدودة.',
    unlocks: 'Push alerts from WeatherRadar (frost/heat warnings) + irrigation scheduler + scouting todos.',
    unlocks_ar: 'تنبيهات دفع من WeatherRadar (تحذيرات صقيع/حرارة) + مجدول الري + مهام الكشف.',
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
    name_ar: 'MapTiler — بلاطات خرائط متجهة',
    description: 'Real slippy maps for the Field Boundary Importer — replaces static SVG preview.',
    description_ar: 'خرائط حقيقية لمستورد حدود الحقل — يستبدل معاينة SVG الثابتة.',
    freeTier: 'Free vector tiles + 4 map styles, weekly updates. 100K tile loads/mo free for non-commercial.',
    freeTier_ar: 'بلاطات متجهة مجانية + 4 أنماط خرائط، تحديثات أسبوعية. 100 ألف تحميل بلاطة/شهر مجاناً لغير التجاري.',
    unlocks: 'Interactive maps in Field Boundary Importer. Real satellite imagery basemap for scouting.',
    unlocks_ar: 'خرائط تفاعلية في مستورد حدود الحقل. خريطة قمر صناعي حقيقية كخلفية للكشف.',
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
    name_ar: 'Google Gemini API — نموذج لغة مجاني',
    description: 'Generous free tier for AI: chat completions + vision (analyze scouting photos).',
    description_ar: 'طبقة مجانية سخية للذكاء: إكمالات الدردشة + رؤية (تحليل صور الكشف).',
    freeTier: '15 req/min, 1,500 req/day, 1M tokens/min — free. No credit card for first 90 days.',
    freeTier_ar: '15 طلب/دقيقة، 1,500 طلب/يوم، 1 مليون رمز/دقيقة — مجاني. بدون بطاقة ائتمان لأول 90 يوماً.',
    unlocks: 'Unlimited "ask the agronomist" responses. Photo-based pest/disease identification in Scouting Log.',
    unlocks_ar: 'ردود غير محدودة لـ «اسأل المهندس الزراعي». تحديد الآفات/الأمراض بالصور في سجل الكشف.',
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
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
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
      tr('# .env.local — paste these into your Next.js project root', '# .env.local — ألصق هذه القيم في جذر مشروع Next.js', '# .env.local — collez ces valeurs à la racine de votre projet Next.js'),
      tr('# Generated by Service Integrations panel', '# تم الإنشاء من لوحة تكاملات الخدمات', '# Généré par le panneau Intégrations des services'),
      '',
    ];
    for (const i of INTEGRATIONS) {
      const v = values[i.id]?.trim();
      const name = isRTL && i.name_ar ? i.name_ar : i.name;
      lines.push(`# ${name}`);
      lines.push(`${i.envVar}=${v || `<your_${i.id}_here>`}`);
      lines.push('');
    }
    return lines.join('\n');
  }, [values, language]);

  const copyEnv = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedId('env');
    toast({ title: tr('Copied .env.local', 'تم نسخ .env.local', '.env.local copié') });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    for (const k of LS_KEYS) localStorage.removeItem(k);
    setValues({});
    setShowEnv(false);
    toast({ title: tr('All keys cleared', 'تم مسح جميع المفاتيح', 'Toutes les clés effacées') });
  };

  return (
    <CalculatorShell
      icon={Settings}
      title={TITLE}
      description={DESC}
      badge={tr('Settings', 'إعدادات', 'Réglages')}
      accent="violet"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Clear All Keys', ar: 'مسح كل المفاتيح', fr: 'Effacer les clés' },
          onClick: handleReset,
          variant: 'primary',
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <div className="lg:col-span-12 space-y-3">
        {/* Ready count banner */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={readyCount > 0 ? 'default' : 'outline'} className="text-[10px]">
            {readyCount}/{INTEGRATIONS.length} {tr('ready', 'جاهز', 'prêtes')}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {tr('All services have free tiers — no credit card required to start.', 'كل الخدمات لها خطط مجانية — لا حاجة لبطاقة ائتمان للبدء.', 'Tous les services ont un plan gratuit — sans carte bancaire.')}
          </span>
        </div>

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
              language={language}
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
            {tr(
              `${showEnv ? 'Hide' : 'Show'} .env.local export (${readyCount} keys set)`,
              `${showEnv ? 'إخفاء' : 'إظهار'} تصدير .env.local (${readyCount} مفاتيح مضبوطة)`,
              `${showEnv ? 'Masquer' : 'Afficher'} l’export .env.local (${readyCount} clés configurées)`,
            )}
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
                {tr('Copy .env.local to clipboard', 'نسخ .env.local إلى الحافظة', 'Copier .env.local dans le presse-papiers')}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                {tr(
                  '💡 Keys entered here are stored in your browser\'s localStorage (per-device). To deploy to production, paste the snippet above into your hosting provider\'s environment variables.',
                  '💡 المفاتيح المُدخلة هنا تُخزَّن في localStorage متصفّحك (لكل جهاز). للنشر الإنتاجي، الصق المقتطف أعلاه في متغيّرات البيئة لدى مزوّد الاستضافة.',
                  '💡 Les clés saisies ici sont stockées dans le localStorage de votre navigateur (par appareil). Pour déployer en production, collez le fragment ci-dessus dans les variables d’environnement de votre hébergeur.',
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </CalculatorShell>
  );
}

// ============================================================================
// Row component
// ============================================================================

function IntegrationRow({
  integration: i, value, onChange, copied, onCopy, isRTL, language,
}: {
  integration: Integration;
  value: string;
  onChange: (v: string) => void;
  copied: boolean;
  onCopy: () => void;
  isRTL: boolean;
  language: Language;
}) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const ready = value.trim().length > 0;

  const Icon = i.icon;
  const name = isRTL && i.name_ar ? i.name_ar : i.name;
  const description = isRTL && i.description_ar ? i.description_ar : i.description;
  const freeTier = isRTL && i.freeTier_ar ? i.freeTier_ar : i.freeTier;
  const unlocks = isRTL && i.unlocks_ar ? i.unlocks_ar : i.unlocks;
  return (
    <div className={`rounded-md border p-2.5 transition-colors ${ready ? 'border-violet-300 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/10' : 'border-border bg-background'}`}>
      <div className="flex items-start gap-2">
        <div
          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: i.color + '20', color: i.color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-xs">{name}</span>
            {ready ? (
              <Badge variant="default" className="text-[9px] bg-emerald-600">
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {tr('Ready', 'جاهز', 'Prêt')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px]">{tr('Not configured', 'غير مُعدّ', 'Non configuré')}</Badge>
            )}
            {i.signupUrl && (
              <a
                href={i.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
              >
                {tr('Sign up', 'سجّل', 'S’inscrire')} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            <div><span className="text-muted-foreground">{tr('Free tier:', 'الخطة المجانية:', 'Offre gratuite :')}</span> {freeTier}</div>
            <div><span className="text-muted-foreground">{tr('Unlocks:', 'يفتح:', 'Débloque :')}</span> {unlocks}</div>
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
