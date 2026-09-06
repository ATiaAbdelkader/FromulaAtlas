'use client';

/**
 * Pricing page — shows Pro and Cooperative plans.
 *
 * URL: /pricing
 *
 * CTA buttons:
 *   - If not logged in → redirect to /auth
 *   - If logged in → POST /api/checkout/create → redirect to Chargily checkout URL
 *
 * Foundation mode: if CHARGILY_SECRET_KEY is not set, the checkout returns
 * a stub URL (/payment-pending) explaining payment is not yet live.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sprout, Check, Loader2, Crown, Users, ArrowRight, ArrowLeft,
  Sparkles, Zap, Shield,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/lib/language-store';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PlanCardProps {
  planId: string;
  name: { en: string; fr: string; ar: string };
  price: number;
  period: { en: string; fr: string; ar: string };
  features: Array<{ en: string; fr: string; ar: string }>;
  highlight?: boolean;
  icon: React.ElementType;
  color: string;
  loading: boolean;
  onSubscribe: () => void;
}

export default function PricingPage() {
  const { isRTL, language } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/pro-status')
        .then(r => r.json())
        .then(data => setIsPro(data.isPro))
        .catch(() => {});
    }
  }, [status]);

  const handleSubscribe = async (plan: string) => {
    if (status !== 'authenticated') {
      router.push('/auth?redirect=/pricing');
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        // Redirect to Chargily checkout (or stub page)
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error ?? 'Checkout failed');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-emerald-700 dark:hover:text-emerald-300">
            <Sprout className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            FormulaAtlas
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {t('Choose your plan', 'اختر خطتك', 'Choisissez votre plan')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(
              'Start free. Upgrade when you need more fields, NDVI satellite maps, or printable PDF reports.',
              'ابدأ مجاناً. الترقية عند الحاجة لمزيد من الحقول أو خرائط NDVI أو تقارير PDF.',
              'Commencez gratuitement. Passez à un plan supérieur selon vos besoins.',
            )}
          </p>
        </div>

        {isPro && (
          <div className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <Crown className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              {t(
                'You are a Pro subscriber. Thank you!',
                'أنت مشترك Pro. شكراً لك!',
                'Vous êtes abonné Pro. Merci !',
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <PlanCard
            planId="free"
            name={{ en: 'Free', fr: 'Gratuit', ar: 'مجاني' }}
            price={0}
            period={{ en: 'forever', fr: 'à vie', ar: 'للأبد' }}
            features={[
              { en: '1 field', fr: '1 parcelle', ar: 'حقل واحد' },
              { en: 'WhatsApp daily brief', fr: 'Brief WhatsApp quotidien', ar: 'ملخص واتساب اليومي' },
              { en: 'Weather + irrigation', fr: 'Météo + irrigation', ar: 'الطقس + الري' },
              { en: 'Basic calculators', fr: 'Calculatrices de base', ar: 'حاسبات أساسية' },
            ]}
            icon={Sparkles}
            color="text-muted-foreground"
            loading={loading === 'free'}
            onSubscribe={() => router.push('/app')}
          />

          {/* Pro */}
          <PlanCard
            planId="pro_monthly"
            name={{ en: 'Pro', fr: 'Pro', ar: 'برو' }}
            price={1500}
            period={{ en: '/month', fr: '/mois', ar: '/شهرياً' }}
            features={[
              { en: 'Multiple fields', fr: 'Parcelles multiples', ar: 'حقول متعددة' },
              { en: 'NDVI satellite maps', fr: 'Cartes NDVI satellite', ar: 'خرائط NDVI' },
              { en: 'PDF report exports', fr: 'Export rapports PDF', ar: 'تصدير تقارير PDF' },
              { en: '90-day history', fr: 'Historique 90 jours', ar: 'سجل 90 يوماً' },
              { en: 'Priority WhatsApp', fr: 'WhatsApp prioritaire', ar: 'واتساب ذو أولوية' },
            ]}
            highlight
            icon={Crown}
            color="text-emerald-600"
            loading={loading === 'pro_monthly'}
            onSubscribe={() => handleSubscribe('pro_monthly')}
          />

          {/* Cooperative */}
          <PlanCard
            planId="coop_monthly"
            name={{ en: 'Cooperative', fr: 'Coopérative', ar: 'تعاونية' }}
            price={15000}
            period={{ en: '/month', fr: '/mois', ar: '/شهرياً' }}
            features={[
              { en: '20-50 members', fr: '20-50 membres', ar: '20-50 عضواً' },
              { en: 'Shared dashboard', fr: 'Tableau de bord partagé', ar: 'لوحة مشتركة' },
              { en: 'Anonymized aggregation', fr: 'Agrégation anonymisée', ar: 'تجميع مجهول' },
              { en: 'Agronomist seats', fr: 'Sièges agronome', ar: 'مقاعد مهندس زراعي' },
              { en: 'API access', fr: 'Accès API', ar: 'وصول API' },
            ]}
            icon={Users}
            color="text-blue-600"
            loading={loading === 'coop_monthly'}
            onSubscribe={() => handleSubscribe('coop_monthly')}
          />
        </div>

        {/* Foundation mode notice */}
        <div className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
            {t('🔧 Foundation mode', '🔧 وضع التأسيس', '🔧 Mode fondation')}
          </p>
          <p className="text-amber-700 dark:text-amber-400">
            {t(
              'Payment integration is ready but not yet live. Subscriptions will be recorded and activated once Chargily is configured.',
              'تكامل الدفع جاهز ولكنه غير مفعّل بعد. سيتم تسجيل الاشتراكات وتفعيلها بمجرد إعداد Chargily.',
              "L'intégration de paiement est prête mais pas encore active. Les abonnements seront enregistrés et activés une fois Chargily configuré.",
            )}
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl font-semibold text-center">
            {t('Questions?', 'أسئلة؟', 'Questions ?')}
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-1">
                {t('What payment methods do you accept?', 'ما طرق الدفع المقبولة؟', 'Quels moyens de paiement acceptez-vous ?')}
              </p>
              <p className="text-muted-foreground">
                {t(
                  'CIB (interbank card), Edahabia (Algeria Post card), and BaridiMob via Chargily.',
                  'بطاقة CIB، بطاقة الذهبية (بريد الجزائر)، وBaridiMob عبر Chargily.',
                  'CIB (carte interbancaire), Edahabia (carte Poste Algérie) et BaridiMob via Chargily.',
                )}
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">
                {t('Can I cancel anytime?', 'هل يمكنني الإلغاء في أي وقت؟', 'Puis-je annuler à tout moment ?')}
              </p>
              <p className="text-muted-foreground">
                {t(
                  'Yes. Your Pro access continues until the end of your billing period, then reverts to Free.',
                  'نعم. يستمر وصول Pro حتى نهاية فترة الفوترة، ثم يعود إلى المجاني.',
                  'Oui. Votre accès Pro continue jusqu\'à la fin de la période de facturation, puis revient à Gratuit.',
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlanCard({
  name, price, period, features, highlight, icon: Icon, color, loading, onSubscribe,
}: PlanCardProps) {
  const { language, isRTL } = useTranslation();
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const t = (en: string, ar: string, fr: string) => (isArabic ? ar : isFrench ? fr : en);

  return (
    <div className={`rounded-xl border-2 p-6 transition-all ${
      highlight
        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-lg scale-105'
        : 'border-border bg-card'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="text-lg font-bold">{name[language]}</h3>
        {highlight && (
          <Badge className="ml-auto" variant="default">
            {t('Popular', 'الأكثر شيوعاً', 'Populaire')}
          </Badge>
        )}
      </div>

      <div className="mb-6">
        <span className="text-3xl font-bold">
          {price === 0
            ? t('Free', 'مجاني', 'Gratuit')
            : `${price.toLocaleString()} DZD`}
        </span>
        {price > 0 && (
          <span className="text-sm text-muted-foreground ml-1">{period[language]}</span>
        )}
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{f[language]}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSubscribe}
        disabled={loading}
        variant={highlight ? 'default' : 'outline'}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : price === 0 ? (
          t('Get started', 'ابدأ الآن', 'Commencer')
        ) : (
          <>
            {t('Subscribe', 'اشترك', 'S\'abonner')}
            <ArrowRight className="h-4 w-4" style={{ transform: isRTL ? 'scaleX(-1)' : '' }} />
          </>
        )}
      </Button>
    </div>
  );
}
